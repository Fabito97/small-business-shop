import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { products, type Product } from '@/server/db/schema';
import { and, eq, gte, lte, or, ilike, desc, asc, count, gt } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const category = searchParams.get('category');
    const q = searchParams.get('q')?.trim();
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'newest';
    const inStockOnly = searchParams.get('inStock') === 'true' || searchParams.get('inStock') === '1';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const offset = (page - 1) * limit;

    const conditions = [eq(products.isActive, true)];

    if (category && category !== 'all') {
      conditions.push(eq(products.category, category as Product['category']));
    }

    if (q) {
      conditions.push(
        or(
          ilike(products.name, `%${q}%`),
          ilike(products.brand, `%${q}%`),
          ilike(products.description, `%${q}%`)
        )!
      );
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      conditions.push(gte(products.priceKobo, Number(minPrice)));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      conditions.push(lte(products.priceKobo, Number(maxPrice)));
    }

    if (inStockOnly) {
      conditions.push(gt(products.stock, 0));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [totalResult] = await db
      .select({ value: count() })
      .from(products)
      .where(whereClause);

    const total = totalResult?.value || 0;
    const pageCount = Math.ceil(total / limit) || 1;

    // Sorting
    let orderBy;
    switch (sort) {
      case 'price_asc':
        orderBy = [asc(products.priceKobo)];
        break;
      case 'price_desc':
        orderBy = [desc(products.priceKobo)];
        break;
      case 'newest':
      default:
        orderBy = [desc(products.createdAt)];
        break;
    }

    const items = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      items,
      total,
      page,
      pageCount,
    });
  } catch (error) {
    console.error('[api/products] Error fetching products:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve products' } },
      { status: 500 }
    );
  }
}
