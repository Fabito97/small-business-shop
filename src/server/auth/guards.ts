import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { validateSession, SESSION_COOKIE_NAME } from './session';
import type { User } from '@/server/db/schema';

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
 * Returns the currently authenticated user based on the session cookie,
 * or null if unauthenticated or session expired.
 * Memoized per-request with React cache().
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return validateSession(token);
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
