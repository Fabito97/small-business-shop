import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import type { User } from '@/server/db/schema';

export interface MobileJwtPayload {
  sub: string;
  email: string;
  role: 'customer' | 'admin';
  name?: string | null;
}

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    'dave-store-mobile-jwt-secret-fallback-32-bytes-key';
  return new TextEncoder().encode(secret);
}

/**
 * Signs a 30-day JWT tailored for mobile clients (Expo / React Native).
 */
export async function signMobileToken(user: User): Promise<string> {
  return await new SignJWT({
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getJwtSecret());
}

/**
 * Verifies a mobile JWT token and returns the decoded payload.
 * Returns null if the token is expired, corrupted, or signature is invalid.
 */
export async function verifyMobileToken(token: string): Promise<MobileJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.sub || !payload.email) {
      return null;
    }

    return {
      sub: payload.sub,
      email: String(payload.email),
      role: (payload.role as 'customer' | 'admin') || 'customer',
      name: payload.name ? String(payload.name) : null,
    };
  } catch {
    return null;
  }
}
