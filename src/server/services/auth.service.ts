import 'server-only';
import { generateState, generateCodeVerifier, decodeIdToken, type OAuth2Tokens } from 'arctic';
import { eq, or } from 'drizzle-orm';
import { db } from '@/server/db';
import { users, type User } from '@/server/db/schema';
import { google } from '@/server/auth/google';
import {
  createSession,
  validateSession,
  deleteSession,
  SESSION_COOKIE_NAME,
} from '@/server/auth/session';

export interface GoogleAuthInitResult {
  url: URL;
  state: string;
  codeVerifier: string;
  nextUrl: string;
}

export interface GoogleCallbackResult {
  user: User;
  token: string;
  expiresAt: Date;
  nextUrl: string;
}

export class AuthServiceError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_STATE'
      | 'OAUTH_EXCHANGE_FAILED'
      | 'INVALID_ID_TOKEN'
      | 'UNVERIFIED_EMAIL',
    message: string
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

export class AuthService {
  /**
   * Initiates Google OAuth by generating secure state, PKCE verifier, and authorization URL.
   */
  static initiateGoogleAuth(nextParam?: string | null): GoogleAuthInitResult {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    let sanitizedNext = '/';
    if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
      sanitizedNext = nextParam;
    }

    const url = google.createAuthorizationURL(state, codeVerifier, [
      'openid',
      'profile',
      'email',
    ]);

    return {
      url,
      state,
      codeVerifier,
      nextUrl: sanitizedNext,
    };
  }

  /**
   * Processes the Google OAuth callback:
   * - Validates state and verifier
   * - Exchanges authorization code for tokens
   * - Extracts and verifies ID token claims
   * - Upserts the user record with ADMIN_EMAILS role resolution
   * - Creates a persistent database session
   */
  static async handleGoogleCallback(params: {
    code: string | null;
    state: string | null;
    storedState: string | null | undefined;
    storedVerifier: string | null | undefined;
    storedNext: string | null | undefined;
  }): Promise<GoogleCallbackResult> {
    const { code, state, storedState, storedVerifier, storedNext } = params;

    let nextUrl = '/';
    if (storedNext && storedNext.startsWith('/') && !storedNext.startsWith('//')) {
      nextUrl = storedNext;
    }

    if (!code || !state || !storedState || !storedVerifier || state !== storedState) {
      throw new AuthServiceError('INVALID_STATE', 'Invalid or tampered OAuth state parameter.');
    }

    let tokens: OAuth2Tokens;
    try {
      tokens = await google.validateAuthorizationCode(code, storedVerifier);
    } catch (error) {
      console.error('[AuthService] Authorization code validation failed:', error);
      throw new AuthServiceError('OAUTH_EXCHANGE_FAILED', 'Failed to exchange authorization code with Google.');
    }

    let claims: {
      sub: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    try {
      claims = decodeIdToken(tokens.idToken()) as typeof claims;
    } catch (error) {
      console.error('[AuthService] Failed to decode Google ID token:', error);
      throw new AuthServiceError('INVALID_ID_TOKEN', 'Failed to decode Google ID token claims.');
    }

    if (!claims.email || !claims.email_verified) {
      throw new AuthServiceError('UNVERIFIED_EMAIL', 'A verified Google email address is required to sign in.');
    }

    const normalizedEmail = claims.email.toLowerCase();

    // Check admin role against configured ADMIN_EMAILS
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isAdmin = adminEmails.includes(normalizedEmail);

    // Upsert user in database
    let user: User;

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
      user = updated;
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
      user = inserted;
    }

    // Create session in database
    const session = await createSession(user.id);

    return {
      user,
      token: session.token,
      expiresAt: session.expiresAt,
      nextUrl,
    };
  }

  /**
   * Validates a session token and retrieves the authenticated user.
   */
  static async validateSession(token: string): Promise<User | null> {
    return validateSession(token);
  }

  /**
   * Invalidates a session token.
   */
  static async logout(token: string): Promise<void> {
    return deleteSession(token);
  }
}

export { SESSION_COOKIE_NAME };
