import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/server/auth/guards';
import { AuthError } from '@/server/auth/guards';
import { getOrder } from '@/server/orders';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const user = await requireUser();
    const { orderNumber } = await params;

    const result = await getOrder(orderNumber, user.id, user.role === 'admin');

    if (!result) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Order not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error('[API Order Detail GET] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve order details' } },
      { status: 500 }
    );
  }
}
