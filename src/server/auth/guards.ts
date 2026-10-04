import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { users, type User } from '@/server/db/schema';
import { validateSession, SESSION_COOKIE_NAME } from './session';
import { verifyMobileToken } from './jwt';

export class AuthError extends Error {
  constructor(
    public readonly statusCode: 401 | 403,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Returns the currently authenticated user based on:
 * 1. Mobile Authorization: Bearer <jwt> header
 * 2. Web session cookie (meridian_session)
 *
 * Memoized per-request with React cache().
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  // 1. Check Mobile Bearer Token in Authorization header
  try {
    const headerStore = await headers();
    const authHeader = headerStore.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.slice(7).trim();
      const payload = await verifyMobileToken(token);
      if (payload?.sub) {
        const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
        if (user) return user;
      }
    }
  } catch {
    // If headers() is unavailable or throws, fallback to cookie check
  }

  // 2. Check Web Session Cookie
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return validateSession(token);
  } catch {
    return null;
  }
});

/**
 * Ensures a valid authenticated user is present.
 * Throws an AuthError(401) if not signed in.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError(401, 'Authentication required');
  }
  return user;
}

/**
 * Ensures an authenticated user with an 'admin' role is present.
 * Throws an AuthError(401) if unauthenticated, or AuthError(403) if not an admin.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'admin') {
    throw new AuthError(403, 'Administrator access required');
  }
  return user;
}
