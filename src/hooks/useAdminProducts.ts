'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Product } from '@/server/db/schema';
import type { CreateProductInput } from '@/lib/validators';

export interface AdminProductsResponse {
  products: Product[];
}

async function fetchAdminProducts(): Promise<AdminProductsResponse> {
  const res = await fetch('/api/admin/products');

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to fetch catalog products');
  }

  return await res.json();
}

export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: fetchAdminProducts,
    staleTime: 30_000,
  });
}

async function postCreateProduct(input: CreateProductInput): Promise<Product> {
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to create watch product');
  }

  const data = await res.json();
  return data.product;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postCreateProduct,
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`"${newProduct.name}" added to watch collection!`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not create product');
    },
  });
}
