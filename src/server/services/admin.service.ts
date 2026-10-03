import 'server-only';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/server/db';
import { orderItems, orders, type Order, type OrderItem } from '@/server/db/schema';
import { OrderService } from './order.service';

export type AdminStats = {
  totalOrders: number;
  pendingOrders: number;
  totalRevenueKobo: number;
};

export class AdminService {
  /**
   * Calculates high-level performance metrics for the admin console.
   */
  static async getStats(): Promise<AdminStats> {
    const allOrders = await db.select().from(orders);

    const totalOrders = allOrders.length;
    let pendingOrders = 0;
    let totalRevenueKobo = 0;

    for (const o of allOrders) {
      if (o.status === 'pending') {
        pendingOrders++;
      }
      if (o.status !== 'cancelled') {
        totalRevenueKobo += o.totalKobo;
      }
    }

    return {
      totalOrders,
      pendingOrders,
      totalRevenueKobo,
    };
  }

  /**
   * Retrieves orders for admin view with optional status filtering.
   */
  static async getOrders(
    statusFilter?: string
  ): Promise<Array<Order & { items: OrderItem[] }>> {
    const query = db.select().from(orders);

    if (
      statusFilter &&
      statusFilter !== 'all' &&
      ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(statusFilter)
    ) {
      query.where(eq(orders.status, statusFilter as Order['status']));
    }

    const orderRows = await query.orderBy(desc(orders.createdAt));
    if (orderRows.length === 0) return [];

    const orderIds = orderRows.map((o) => o.id);
    const allItems = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const itemsByOrderId = new Map<string, OrderItem[]>();
    for (const item of allItems) {
      const list = itemsByOrderId.get(item.orderId) || [];
      list.push(item);
      itemsByOrderId.set(item.orderId, list);
    }

    return orderRows.map((order) => ({
      ...order,
      items: itemsByOrderId.get(order.id) || [],
    }));
  }

  /**
   * Updates an order's status. If updated to 'cancelled', it invokes cancelOrder
   * to restock inventory safely in a transaction.
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: Order['status']
  ): Promise<Order | null> {
    if (newStatus === 'cancelled') {
      return await OrderService.cancelOrder(orderId, undefined, true);
    }

    const [updated] = await db
      .update(orders)
      .set({ status: newStatus })
      .where(eq(orders.id, orderId))
      .returning();

    return updated || null;
  }
}
