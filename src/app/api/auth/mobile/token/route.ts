import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth/guards';
import { signMobileToken } from '@/server/auth/jwt';

export const dynamic = 'force-dynamic';

/**
 * GET or POST /api/auth/mobile/token
 * Returns a mobile JWT token for the currently authenticated user
 * (authenticated either via web session cookie or existing token).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

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
}

export async function POST() {
  return GET();
}
