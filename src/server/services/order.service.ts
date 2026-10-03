import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { orderItems, orders, products, type Order, type OrderItem } from '@/server/db/schema';
import { SHOP } from '@/config/shop';
import type { CreateOrderInput } from '@/lib/validators';
import { EmailService } from './email.service';

export class OrderError extends Error {
  constructor(
    public readonly code: 'EMPTY_CART' | 'PRODUCT_UNAVAILABLE' | 'OUT_OF_STOCK' | 'INVALID_STATE',
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

export class OrderService {
  /**
   * Creates an order inside an ACID transaction on the Neon WebSocket Pool.
   * Re-reads prices from DB, checks and decrements inventory atomically,
   * creates order and line item records, and automatically triggers confirmation email.
   */
  static async createOrder(
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

    const uniqueProductIds = Array.from(mergedItemsMap.keys());

    // Execute the complete purchase within a single ACID database transaction
    const transactionResult = await db.transaction(async (tx) => {
      // 1. Fetch current price, stock, and availability from DB
      const dbProducts = await tx
        .select()
        .from(products)
        .where(
          and(
            inArray(products.id, uniqueProductIds),
            eq(products.isActive, true)
          )
        );

      if (dbProducts.length !== uniqueProductIds.length) {
        throw new OrderError(
          'PRODUCT_UNAVAILABLE',
          'One or more selected timepieces are no longer available in our vault'
        );
      }

      // Map products for fast O(1) lookup
      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      // 2. Validate stock levels & calculate subtotal strictly from DB prices
      let subtotalKobo = 0;
      const orderLineItemsToInsert: Array<{
        productId: string;
        productName: string;
        imageUrl: string | null;
        unitPriceKobo: number;
        quantity: number;
        lineTotalKobo: number;
      }> = [];

      for (const [productId, requestedQty] of mergedItemsMap.entries()) {
        const prod = productMap.get(productId)!;

        if (prod.stock < requestedQty) {
          throw new OrderError(
            'OUT_OF_STOCK',
            `Insufficient vault stock for "${prod.name}". Only ${prod.stock} piece(s) available.`
          );
        }

        const lineTotal = prod.priceKobo * requestedQty;
        subtotalKobo += lineTotal;

        orderLineItemsToInsert.push({
          productId: prod.id,
          productName: prod.name,
          imageUrl: prod.imageUrl,
          unitPriceKobo: prod.priceKobo,
          quantity: requestedQty,
          lineTotalKobo: lineTotal,
        });
      }

      // 3. Atomically decrement stock with conditional safety guards
      for (const [productId, qty] of mergedItemsMap.entries()) {
        const updated = await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${qty}`,
          })
          .where(
            and(
              eq(products.id, productId),
              sql`${products.stock} >= ${qty}`
            )
          )
          .returning({ id: products.id, stock: products.stock });

        if (updated.length === 0) {
          throw new OrderError(
            'OUT_OF_STOCK',
            'Stock conflict detected during reservation. Transaction rolled back.'
          );
        }
      }

      // 4. Calculate shipping fee according to store rules
      const isFreeShipping = subtotalKobo >= SHOP.freeShippingThresholdKobo;
      const shippingKobo = isFreeShipping ? 0 : SHOP.shippingFeeKobo;
      const totalKobo = subtotalKobo + shippingKobo;

      const orderNumber = makeOrderNumber();

      // 5. Insert order row (customerEmail strictly comes from authenticated session)
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId,
          status: 'pending',
          paymentMethod: input.paymentMethod,
          subtotalKobo,
          shippingKobo,
          totalKobo,
          customerName: input.shipping.name.trim(),
          customerEmail: userEmail.trim().toLowerCase(),
          customerPhone: input.shipping.phone.trim(),
          shippingAddress: input.shipping.address.trim(),
          city: input.shipping.city.trim(),
          state: input.shipping.state.trim(),
          notes: input.shipping.notes?.trim() || null,
        })
        .returning();

      // 6. Insert all order items
      await tx.insert(orderItems).values(
        orderLineItemsToInsert.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.productName,
          unitPriceKobo: item.unitPriceKobo,
          quantity: item.quantity,
          lineTotalKobo: item.lineTotalKobo,
        }))
      );

      return {
        order: newOrder,
        items: orderLineItemsToInsert,
      };
    });

    // 7. Dispatch confirmation email asynchronously (does not block or fail the order)
    EmailService.sendOrderConfirmation(transactionResult.order, transactionResult.items).catch(
      (err) => {
        console.error('[OrderService] Email dispatch failed in background:', err);
      }
    );

    return transactionResult;
  }

  /**
   * Retrieves an order and its line items by order number.
   * Enforces owner or administrator authorization.
   */
  static async getOrder(
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
  static async getUserOrders(userId: string): Promise<Array<Order & { items: OrderItem[] }>> {
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

  /**
   * Cancels an order and restocks inventory within an ACID transaction.
   */
  static async cancelOrder(
    orderId: string,
    userId?: string,
    isAdmin: boolean = false
  ): Promise<Order | null> {
    return await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) return null;

      // Access control check
      if (!isAdmin && (!userId || order.userId !== userId)) {
        return null;
      }

      // If already cancelled, return existing state
      if (order.status === 'cancelled') {
        return order;
      }

      // 1. Fetch line items to restock
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      // 2. Increment stock back for each line item
      for (const item of items) {
        if (item.productId) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
            })
            .where(eq(products.id, item.productId));
        }
      }

      // 3. Mark order as cancelled
      const [cancelledOrder] = await tx
        .update(orders)
        .set({ status: 'cancelled' })
        .where(eq(orders.id, order.id))
        .returning();

      return cancelledOrder;
    });
  }
}
