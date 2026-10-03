import { NextResponse } from 'next/server';
import { ProductService } from '@/server/services/product.service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const category = searchParams.get('category') || undefined;
    const q = searchParams.get('q')?.trim() || undefined;
    const minPriceRaw = searchParams.get('minPrice');
    const maxPriceRaw = searchParams.get('maxPrice');
    const sort = (searchParams.get('sort') as 'newest' | 'price_asc' | 'price_desc') || 'newest';
    const inStock = searchParams.get('inStock') === 'true' || searchParams.get('inStock') === '1';

    const minPrice = minPriceRaw && !isNaN(Number(minPriceRaw)) ? Number(minPriceRaw) : undefined;
    const maxPrice = maxPriceRaw && !isNaN(Number(maxPriceRaw)) ? Number(maxPriceRaw) : undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));

    const result = await ProductService.listProducts({
      category,
      q,
      minPrice,
      maxPrice,
      sort,
      inStock,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/products] Error fetching products:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve products' } },
      { status: 500 }
    );
  }
}
