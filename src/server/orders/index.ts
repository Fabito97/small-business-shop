import 'server-only';
import {
  OrderService,
  OrderError,
  makeOrderNumber,
  type OrderCreationResult,
} from '@/server/services/order.service';
import { AdminService, type AdminStats } from '@/server/services/admin.service';
import type { Order, OrderItem } from '@/server/db/schema';
import type { CreateOrderInput } from '@/lib/validators';

export { OrderError, makeOrderNumber, type OrderCreationResult, type AdminStats };

/**
 * Creates an order inside an ACID transaction on the Neon WebSocket Pool.
 */
export async function createOrder(
  userId: string,
  userEmail: string,
  input: CreateOrderInput
): Promise<OrderCreationResult> {
  return OrderService.createOrder(userId, userEmail, input);
}

/**
 * Cancels an order and restocks inventory within an ACID transaction.
 */
export async function cancelOrder(
  orderId: string,
  userId?: string,
  isAdmin: boolean = false
): Promise<Order | null> {
  return OrderService.cancelOrder(orderId, userId, isAdmin);
}

/**
 * Retrieves an order and its items by order number.
 */
export async function getOrder(
  orderNumber: string,
  userId?: string,
  isAdmin: boolean = false
): Promise<{ order: Order; items: OrderItem[] } | null> {
  return OrderService.getOrder(orderNumber, userId, isAdmin);
}

/**
 * Retrieves all orders for a specific user.
 */
export async function getUserOrders(
  userId: string
): Promise<Array<Order & { items: OrderItem[] }>> {
  return OrderService.getUserOrders(userId);
}

/**
 * Calculates high-level performance metrics for the admin console.
 */
export async function getAdminStats(): Promise<AdminStats> {
  return AdminService.getStats();
}

/**
 * Retrieves orders for admin view with optional status filtering.
 */
export async function getAdminOrders(
  statusFilter?: string
): Promise<Array<Order & { items: OrderItem[] }>> {
  return AdminService.getOrders(statusFilter);
}

/**
 * Updates an order's status. If updated to 'cancelled', it invokes cancelOrder
 * to restock inventory safely in a transaction.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: Order['status']
): Promise<Order | null> {
  return AdminService.updateOrderStatus(orderId, newStatus);
}
