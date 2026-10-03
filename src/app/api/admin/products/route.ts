import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin, AuthError } from '@/server/auth/guards';
import { ProductService } from '@/server/services';
import { createProductSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/products
 * Retrieves all products for the administrative dashboard.
 */
export async function GET() {
  try {
    await requireAdmin();
    const products = await ProductService.listAllProducts();
    return NextResponse.json({ products });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN', message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('[API Admin Products GET] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve products' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Creates a new watch product in the catalogue.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const parseResult = createProductSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product details provided.',
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const newProduct = await ProductService.createProduct(parseResult.data);

    // Revalidate public storefront caches
    try {
      revalidatePath('/shop');
      revalidatePath('/');
    } catch (e) {
      console.warn('[API Admin Products POST] Failed to trigger revalidation:', e);
    }

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: error.statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN', message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error('[API Admin Products POST] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create watch product' } },
      { status: 500 }
    );
  }
}
