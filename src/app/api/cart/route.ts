import { NextRequest, NextResponse } from 'next/server';
import { requireUser, AuthError } from '@/server/auth/guards';
import { CartService } from '@/server/services';

export const dynamic = 'force-dynamic';

function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: error.message } },
      { status: error.statusCode }
    );
  }
  console.error('[API Cart] Unexpected error:', error);
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Failed to process cart request' } },
    { status: 500 }
  );
}

/**
 * GET /api/cart
 * Retrieves the current authenticated user's cart items with full product snapshots.
 * Supports both Web Session cookies and Mobile Authorization: Bearer <jwt>.
 */
export async function GET() {
  try {
    const user = await requireUser();
    const items = await CartService.getUserCart(user.id);
    return NextResponse.json({ items });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * POST /api/cart
 * Adds or updates a single item in the user's cart.
 * Body: { productId: string, quantity: number }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { productId, quantity, updatedAt } = body;

    if (!productId || typeof productId !== 'string' || typeof quantity !== 'number') {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'productId and numeric quantity are required' } },
        { status: 400 }
      );
    }

    await CartService.setItem(
      user.id,
      productId,
      Math.max(0, Math.floor(quantity)),
      updatedAt
    );
    const items = await CartService.getUserCart(user.id);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * PUT /api/cart
 * Merges client-side cart items into the user's server cart (used when logging in or bulk sync).
 * Body: { items: Array<{ productId: string, quantity: number }> }
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const itemsInput = Array.isArray(body?.items) ? body.items : [];

    const items = await CartService.syncCart(user.id, itemsInput);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * DELETE /api/cart
 * Clears the user's active cart.
 */
export async function DELETE() {
  try {
    const user = await requireUser();
    await CartService.clearCart(user.id);
    return NextResponse.json({ success: true, items: [] });
  } catch (error) {
    return handleAuthError(error);
  }
}
