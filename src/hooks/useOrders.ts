'use client';

import { useQuery } from '@tanstack/react-query';
import type { Order, OrderItem } from '@/server/db/schema';

export type UserOrderWithItems = Order & { items: OrderItem[] };

async function fetchMyOrders(): Promise<UserOrderWithItems[]> {
  const res = await fetch('/api/orders');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to fetch orders');
  }
  const data = await res.json();
  return data.orders || [];
}

export function useMyOrders() {
  return useQuery({
    queryKey: ['orders', 'my-orders'],
    queryFn: fetchMyOrders,
    staleTime: 30_000,
  });
}

async function fetchOrderDetail(orderNumber: string): Promise<{ order: Order; items: OrderItem[] }> {
  const res = await fetch(`/api/orders/${orderNumber}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to fetch order details');
  }
  return await res.json();
}

export function useOrderDetail(orderNumber: string) {
  return useQuery({
    queryKey: ['orders', 'detail', orderNumber],
    queryFn: () => fetchOrderDetail(orderNumber),
    enabled: Boolean(orderNumber),
  });
}
