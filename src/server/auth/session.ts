import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/server/db';
import { sessions, users, type User } from '@/server/db/schema';

export const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION_DAYS = 30;

export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function validateSession(token: string): Promise<User | null> {
  const sessionId = hashToken(token);

  const result = await db
    .select({
      user: users,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { user, session } = result[0];

  // If session is within 15 days of expiring, extend it by 30 days
  const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
  if (Date.now() >= session.expiresAt.getTime() - fifteenDaysMs) {
    session.expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
    await db
      .update(sessions)
      .set({ expiresAt: session.expiresAt })
      .where(eq(sessions.id, session.id));
  }

  return user;
}

export async function deleteSession(token: string): Promise<void> {
  const sessionId = hashToken(token);
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}
