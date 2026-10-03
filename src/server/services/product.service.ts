import 'server-only';
import { and, asc, count, desc, eq, gt, gte, ilike, lte, ne, or } from 'drizzle-orm';
import { db } from '@/server/db';
import { products, type Product } from '@/server/db/schema';

export interface ProductListParams {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  inStock?: boolean;
  page?: number;
  limit?: number;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
}

export class ProductService {
  /**
   * Retrieves a paginated and filtered list of active products.
   */
  static async listProducts(params: ProductListParams = {}): Promise<ProductListResult> {
    const {
      category,
      q,
      minPrice,
      maxPrice,
      sort = 'newest',
      inStock = false,
      page = 1,
      limit = 12,
    } = params;

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;

    const conditions = [eq(products.isActive, true)];

    if (category && category !== 'all') {
      conditions.push(eq(products.category, category as Product['category']));
    }

    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      conditions.push(
        or(
          ilike(products.name, term),
          ilike(products.brand, term),
          ilike(products.description, term)
        )!
      );
    }

    if (typeof minPrice === 'number' && !isNaN(minPrice)) {
      conditions.push(gte(products.priceKobo, minPrice));
    }

    if (typeof maxPrice === 'number' && !isNaN(maxPrice)) {
      conditions.push(lte(products.priceKobo, maxPrice));
    }

    if (inStock) {
      conditions.push(gt(products.stock, 0));
    }

    const whereClause = and(...conditions);

    // Count total matches
    const [totalResult] = await db
      .select({ value: count() })
      .from(products)
      .where(whereClause);

    const total = totalResult?.value || 0;
    const pageCount = Math.ceil(total / safeLimit) || 1;

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
      .limit(safeLimit)
      .offset(offset);

    return {
      items,
      total,
      page: safePage,
      pageCount,
    };
  }

  /**
   * Retrieves a single active timepiece by its unique slug.
   */
  static async getProductBySlug(slug: string): Promise<Product | null> {
    if (!slug) return null;

    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);

    return product || null;
  }

  /**
   * Retrieves a single active timepiece by its unique UUID ID.
   */
  static async getProductById(id: string): Promise<Product | null> {
    if (!id) return null;

    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.isActive, true)))
      .limit(1);

    return product || null;
  }

  /**
   * Retrieves top featured watches for landing showcases.
   */
  static async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.featured), desc(products.createdAt))
      .limit(limit);
  }

  /**
   * Retrieves related watches within the same category, excluding the current timepiece.
   */
  static async getRelatedProducts(
    category: Product['category'],
    excludeSlug: string,
    limit: number = 4
  ): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.category, category),
          eq(products.isActive, true),
          ne(products.slug, excludeSlug)
        )
      )
      .limit(limit);
  }

  /**
   * Retrieves all active slugs for static route generation and sitemaps.
   */
  static async getAllActiveSlugs(): Promise<string[]> {
    const rows = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.isActive, true));

    return rows.map((r) => r.slug);
  }
}
