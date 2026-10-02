import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { orderItems, orders, products, type Order, type OrderItem } from '@/server/db/schema';
import { SHOP } from '@/config/shop';
import type { CreateOrderInput } from '@/lib/validators';

export class OrderError extends Error {
  constructor(
    public code: 'EMPTY_CART' | 'PRODUCT_UNAVAILABLE' | 'OUT_OF_STOCK' | 'INVALID_STATE',
    msg: string
  ) {
    super(msg);
    this.name = 'OrderError';
  }
}

/**
 * Generates an uppercase alphanumeric order number like MT-7K2Q9X.
 */
export function makeOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `MT-${code}`;
}

export type OrderCreationResult = {
  order: Order;
  items: Array<{
    productId: string;
    productName: string;
    imageUrl: string | null;
    unitPriceKobo: number;
    quantity: number;
  }>;
};

/**
 * Creates an order inside an ACID transaction on the Neon WebSocket Pool.
 * Re-reads prices from DB, checks and decrements inventory atomically.
 */
export async function createOrder(
  userId: string,
  userEmail: string,
  input: CreateOrderInput
): Promise<OrderCreationResult> {
  if (!input.items || input.items.length === 0) {
    throw new OrderError('EMPTY_CART', 'Your cart is empty');
  }

  // Deduplicate items if multiple instances of same productId were submitted
  const mergedItemsMap = new Map<string, number>();
  for (const it of input.items) {
    const existing = mergedItemsMap.get(it.productId) || 0;
    mergedItemsMap.set(it.productId, Math.min(10, existing + it.quantity));
  }
  const consolidatedItems = Array.from(mergedItemsMap.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  const productIds = consolidatedItems.map((i) => i.productId);

  return await db.transaction(async (tx) => {
    // 1. Fetch live product records for all items in one query
    const dbProducts = await tx
      .select()
      .from(products)
      .where(and(inArray(products.id, productIds), eq(products.isActive, true)));

    const byId = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotalKobo = 0;
    const lines: Array<{
      productId: string;
      productName: string;
      imageUrl: string | null;
      unitPriceKobo: number;
      quantity: number;
    }> = [];

    // 2. Atomically decrement stock and compute authoritative subtotal
    for (const it of consolidatedItems) {
      const p = byId.get(it.productId);
      if (!p) {
        throw new OrderError(
          'PRODUCT_UNAVAILABLE',
          'One or more selected timepieces are no longer available in our collection.'
        );
      }

      // Atomic conditional update: decreases stock only if sufficient stock exists
      const updated = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${it.quantity}` })
        .where(and(eq(products.id, p.id), gte(products.stock, it.quantity)))
        .returning({ id: products.id, stock: products.stock });

      if (updated.length === 0) {
        throw new OrderError(
          'OUT_OF_STOCK',
          `Insufficient stock available for "${p.name}". Please adjust quantity or select another timepiece.`
        );
      }

      subtotalKobo += p.priceKobo * it.quantity;
      lines.push({
        productId: p.id,
        productName: p.name,
        imageUrl: p.imageUrl,
        unitPriceKobo: p.priceKobo,
        quantity: it.quantity,
      });
    }

    // 3. Authoritative shipping calculation
    const shippingKobo =
      subtotalKobo >= SHOP.freeShippingThresholdKobo ? 0 : SHOP.shippingFeeKobo;
    const totalKobo = subtotalKobo + shippingKobo;

    // 4. Create Order row with user's verified session email
    const orderNumber = makeOrderNumber();
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        userId,
        paymentMethod: input.paymentMethod,
        subtotalKobo,
        shippingKobo,
        totalKobo,
        customerName: input.shipping.name,
        customerEmail: userEmail,
        customerPhone: input.shipping.phone,
        shippingAddress: input.shipping.address,
        city: input.shipping.city,
        state: input.shipping.state,
        notes: input.shipping.notes || null,
        status: 'pending',
      })
      .returning();

    // 5. Insert Order Items snapshots
    await tx.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        productName: l.productName,
        imageUrl: l.imageUrl,
        unitPriceKobo: l.unitPriceKobo,
        quantity: l.quantity,
      }))
    );

    return { order, items: lines };
  });
}

/**
 * Cancels an order and restocks items in a transaction.
 */
export async function cancelOrder(orderId: string): Promise<Order | null> {
  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existing || existing.status === 'cancelled') {
      return existing || null;
    }

    // Fetch items with associated products
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Restock each product
    for (const it of items) {
      if (it.productId) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${it.quantity}` })
          .where(eq(products.id, it.productId));
      }
    }

    // Set order status to cancelled
    const [cancelledOrder] = await tx
      .update(orders)
      .set({ status: 'cancelled' })
      .where(eq(orders.id, orderId))
      .returning();

    return cancelledOrder;
  });
}

/**
 * Retrieves an order and its items by order number.
 * Enforces owner/admin authorization.
 */
export async function getOrder(
  orderNumber: string,
  userId?: string,
  isAdmin: boolean = false
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) return null;

  // Security check: non-admins cannot view other users' orders
  if (!isAdmin && (!userId || order.userId !== userId)) {
    return null;
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return { order, items };
}

/**
 * Retrieves all orders for a specific user.
 */
export async function getUserOrders(userId: string): Promise<Array<Order & { items: OrderItem[] }>> {
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  if (userOrders.length === 0) return [];

  const orderIds = userOrders.map((o) => o.id);
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

  return userOrders.map((order) => ({
    ...order,
    items: itemsByOrderId.get(order.id) || [],
  }));
}
