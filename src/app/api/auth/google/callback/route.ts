import { cookies } from 'next/headers';
import { decodeIdToken, OAuth2Tokens } from 'arctic';
import { eq, or } from 'drizzle-orm';
import { google } from '@/server/auth/google';
import { createSession, SESSION_COOKIE_NAME } from '@/server/auth/session';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';

interface GoogleIdTokenClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('g_state')?.value;
  const storedVerifier = cookieStore.get('g_code_verifier')?.value;
  const storedNext = cookieStore.get('g_next')?.value;

  // Sanitize redirect target
  let nextUrl = '/';
  if (storedNext && storedNext.startsWith('/') && !storedNext.startsWith('//')) {
    nextUrl = storedNext;
  }

  // Strict state validation (reject tampered or expired OAuth states)
  if (!code || !state || !storedState || !storedVerifier || state !== storedState) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'INVALID_STATE',
          message: 'Invalid or tampered OAuth state parameter.',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, storedVerifier);
  } catch (error) {
    console.error('[auth] Authorization code validation failed:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'OAUTH_EXCHANGE_FAILED',
          message: 'Failed to exchange authorization code with Google.',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  let claims: GoogleIdTokenClaims;
  try {
    claims = decodeIdToken(tokens.idToken()) as GoogleIdTokenClaims;
  } catch (error) {
    console.error('[auth] Failed to decode Google ID token:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INVALID_ID_TOKEN',
          message: 'Failed to decode Google ID token claims.',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!claims.email || !claims.email_verified) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'UNVERIFIED_EMAIL',
          message: 'A verified Google email address is required to sign in.',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const normalizedEmail = claims.email.toLowerCase();

  // Check admin role against configured ADMIN_EMAILS
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.includes(normalizedEmail);

  // Upsert user in database
  let userId: string;

  const existingUsers = await db
    .select()
    .from(users)
    .where(or(eq(users.googleId, claims.sub), eq(users.email, normalizedEmail)))
    .limit(1);

  if (existingUsers.length > 0) {
    const existing = existingUsers[0];
    const [updated] = await db
      .update(users)
      .set({
        googleId: claims.sub,
        email: normalizedEmail,
        name: claims.name || existing.name,
        avatarUrl: claims.picture || existing.avatarUrl,
        ...(isAdmin ? { role: 'admin' as const } : {}),
      })
      .where(eq(users.id, existing.id))
      .returning();
    userId = updated.id;
  } else {
    const [inserted] = await db
      .insert(users)
      .values({
        googleId: claims.sub,
        email: normalizedEmail,
        name: claims.name || null,
        avatarUrl: claims.picture || null,
        role: isAdmin ? 'admin' : 'customer',
      })
      .returning();
    userId = inserted.id;
  }

  // Create persistent session
  const { token, expiresAt } = await createSession(userId);

  // Set session cookie
  const isProd = process.env.NODE_ENV === 'production';
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    expires: expiresAt,
  });

  // Clean up transient OAuth cookies
  cookieStore.delete('g_state');
  cookieStore.delete('g_code_verifier');
  cookieStore.delete('g_next');

  // Redirect to requested next page or home
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const destination = new URL(nextUrl, baseUrl);
  return Response.redirect(destination.toString(), 302);
}
