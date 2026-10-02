'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Order, OrderItem } from '@/server/db/schema';
import type { AdminStats } from '@/server/orders';

export type AdminOrderWithItems = Order & { items: OrderItem[] };

export type AdminOrdersResponse = {
  orders: AdminOrderWithItems[];
  stats: AdminStats;
};

async function fetchAdminOrders(status?: string): Promise<AdminOrdersResponse> {
  const url = status && status !== 'all' ? `/api/admin/orders?status=${status}` : '/api/admin/orders';
  const res = await fetch(url);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to fetch admin orders');
  }

  return await res.json();
}

export function useAdminOrders(status?: string) {
  return useQuery({
    queryKey: ['admin', 'orders', status || 'all'],
    queryFn: () => fetchAdminOrders(status),
    staleTime: 15_000,
  });
}

async function patchOrderStatus({
  orderId,
  status,
}: {
  orderId: string;
  status: Order['status'];
}): Promise<Order> {
  const res = await fetch(`/api/admin/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to update order status');
  }

  const data = await res.json();
  return data.order;
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchOrderStatus,
    onSuccess: (updatedOrder) => {
      toast.success(`Order ${updatedOrder.orderNumber} status changed to ${updatedOrder.status}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order status');
    },
  });
}
