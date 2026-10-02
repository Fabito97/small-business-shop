import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError } from '@/server/auth/guards';
import { updateOrderStatus } from '@/server/orders';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], {
    message: 'Invalid order status',
  }),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing update payload' } },
        { status: 400 }
      );
    }

    const { status } = updateStatusSchema.parse(body);

    const updated = await updateOrderStatus(id, status);
    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Order record not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ order: updated });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN', message: error.message } },
        { status: error.statusCode }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.issues[0]?.message || 'Invalid status' } },
        { status: 400 }
      );
    }

    console.error('[API Admin Order PATCH] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update order status' } },
      { status: 500 }
    );
  }
}
