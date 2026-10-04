import 'server-only';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/server/db';
import { cartItems, products } from '@/server/db/schema';

export interface PopulatedCartItem {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: Date;
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    priceKobo: number;
    imageUrl: string;
    stock: number;
    category: string;
  };
}

export class CartService {
  /**
   * Retrieves all active cart items for a user, populated with product details.
   */
  static async getUserCart(userId: string): Promise<PopulatedCartItem[]> {
    const rows = await db
      .select({
        cartItem: cartItems,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.updatedAt));

    return rows.map(({ cartItem, product }) => ({
      id: cartItem.id,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      updatedAt: cartItem.updatedAt,
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        priceKobo: product.priceKobo,
        imageUrl: product.imageUrl,
        stock: product.stock,
        category: product.category,
      },
    }));
  }

  /**
   * Sets or updates quantity for a specific product in user's cart.
   * If quantity <= 0, deletes the item.
   */
  static async setItem(
    userId: string,
    productId: string,
    quantity: number,
    clientUpdatedAt?: string | Date
  ): Promise<void> {
    if (quantity <= 0) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
      return;
    }

    // Verify product exists and has stock
    const [product] = await db
      .select({ id: products.id, stock: products.stock })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product || product.stock <= 0) return;

    const finalQty = Math.min(quantity, product.stock);
    const updatedTime = clientUpdatedAt ? new Date(clientUpdatedAt) : new Date();

    await db
      .insert(cartItems)
      .values({
        userId,
        productId,
        quantity: finalQty,
        updatedAt: updatedTime,
      })
      .onConflictDoUpdate({
        target: [cartItems.userId, cartItems.productId],
        set: {
          quantity: finalQty,
          updatedAt: updatedTime,
        },
      });
  }

  /**
   * Syncs an array of client cart items into the user's database cart using Last-Write-Wins.
   * Compares the client item's updatedAt timestamp with the existing DB item's updatedAt:
   * - If incoming.updatedAt >= db.updatedAt: the client was edited more recently, so the
   *   incoming quantity is written to the database (clamped to stock).
   * - If db.updatedAt > incoming.updatedAt: the database holds a more recent update (e.g. from
   *   another device), so the database quantity is preserved.
   * - If the product does not exist in the DB, it is inserted with the client quantity.
   * - Any other existing items in the database remain intact.
   */
  static async syncCart(
    userId: string,
    items: Array<{ productId: string; quantity: number; updatedAt?: string | Date }>
  ): Promise<PopulatedCartItem[]> {
    if (!items.length) {
      return this.getUserCart(userId);
    }

    const existingDbItems = await db
      .select({
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        updatedAt: cartItems.updatedAt,
      })
      .from(cartItems)
      .where(eq(cartItems.userId, userId));

    const dbMap = new Map(existingDbItems.map((row) => [row.productId, row]));

    for (const item of items) {
      if (item.quantity <= 0) continue;

      const existing = dbMap.get(item.productId);
      const incomingTime = item.updatedAt ? new Date(item.updatedAt).getTime() : Date.now();

      if (existing) {
        const dbTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
        // Last-Write-Wins: only overwrite if client timestamp is newer or equal
        if (incomingTime >= dbTime) {
          await this.setItem(userId, item.productId, item.quantity, new Date(incomingTime));
        }
      } else {
        await this.setItem(userId, item.productId, item.quantity, new Date(incomingTime));
      }
    }

    return this.getUserCart(userId);
  }

  /**
   * Removes all items from a user's cart.
   */
  static async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }
}
