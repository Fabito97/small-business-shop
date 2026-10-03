import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/server/auth/guards';
import { AdminService } from '@/server/services';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || undefined;

    const [orders, stats] = await Promise.all([
      AdminService.getOrders(statusFilter),
      AdminService.getStats(),
    ]);

    return NextResponse.json({ orders, stats });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN', message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error('[API Admin Orders GET] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve admin orders' } },
      { status: 500 }
    );
  }
}
