import { NextRequest, NextResponse } from 'next/server';
import { eq, or } from 'drizzle-orm';
import { db } from '@/server/db';
import { users, type User } from '@/server/db/schema';
import { signMobileToken } from '@/server/auth/jwt';

export const dynamic = 'force-dynamic';

interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
  picture?: string;
  aud?: string;
  error_description?: string;
}

/**
 * POST /api/auth/mobile/google
 * Authenticates a mobile client (React Native / Flutter / iOS / Android)
 * using a native Google ID Token.
 *
 * Request Body:
 * { "idToken": "..." }
 *
 * Response:
 * { "success": true, "token": "<jwt>", "user": { ... } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Missing or invalid idToken' } },
        { status: 400 }
      );
    }

    // Verify ID token with Google's tokeninfo endpoint
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`;
    const googleRes = await fetch(verifyUrl, { method: 'GET' });

    if (!googleRes.ok) {
      const errData = (await googleRes.json().catch(() => ({}))) as GoogleTokenInfo;
      console.error('[Mobile Auth Google] Token verification failed:', errData);
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_TOKEN',
            message: errData.error_description || 'Invalid Google ID token',
          },
        },
        { status: 401 }
      );
    }

    const claims = (await googleRes.json()) as GoogleTokenInfo;

    const isVerified =
      claims.email_verified === true || claims.email_verified === 'true';

    if (!claims.email || !isVerified) {
      return NextResponse.json(
        {
          error: {
            code: 'UNVERIFIED_EMAIL',
            message: 'A verified Google email address is required to sign in',
          },
        },
        { status: 400 }
      );
    }

    const normalizedEmail = claims.email.toLowerCase().trim();

    // Check admin status against configured ADMIN_EMAILS
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isAdmin = adminEmails.includes(normalizedEmail);

    let user: User;

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(or(eq(users.googleId, claims.sub), eq(users.email, normalizedEmail)))
      .limit(1);

    if (existingUser) {
      const [updatedUser] = await db
        .update(users)
        .set({
          googleId: claims.sub,
          name: claims.name || existingUser.name,
          avatarUrl: claims.picture || existingUser.avatarUrl,
          role: isAdmin ? 'admin' : existingUser.role,
        })
        .where(eq(users.id, existingUser.id))
        .returning();

      user = updatedUser;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          googleId: claims.sub,
          name: claims.name || 'Dave Store Customer',
          avatarUrl: claims.picture || null,
          role: isAdmin ? 'admin' : 'customer',
        })
        .returning();

      user = newUser;
    }

    // Sign mobile JWT token
    const token = await signMobileToken(user);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: unknown) {
    console.error('[Mobile Auth Google] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process mobile authentication' } },
      { status: 500 }
    );
  }
}
