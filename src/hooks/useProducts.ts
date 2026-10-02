'use client';

import { useQuery } from '@tanstack/react-query';
import type { Product } from '@/server/db/schema';

export interface ProductFilters {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  inStock?: boolean;
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
}

async function fetchProducts(filters: ProductFilters): Promise<ProductsResponse> {
  const params = new URLSearchParams();

  if (filters.category && filters.category !== 'all') {
    params.set('category', filters.category);
  }
  if (filters.q) {
    params.set('q', filters.q);
  }
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    params.set('minPrice', filters.minPrice.toString());
  }
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    params.set('maxPrice', filters.maxPrice.toString());
  }
  if (filters.sort) {
    params.set('sort', filters.sort);
  }
  if (filters.inStock) {
    params.set('inStock', 'true');
  }
  if (filters.page) {
    params.set('page', filters.page.toString());
  }
  if (filters.limit) {
    params.set('limit', filters.limit.toString());
  }

  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to fetch watches');
  }

  return res.json();
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });
}
