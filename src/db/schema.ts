// src/db/schema.ts  (Drizzle ORM, Neon Postgres)
import { sql, relations } from 'drizzle-orm';
import {
  pgTable, uuid, text, bigint, integer, boolean, timestamp, index, check,
} from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true });

// ---------- AUTH ----------
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  googleId: text('google_id').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['customer', 'admin'] }).notNull().default('customer'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

// sessions.id = SHA-256 hex of the raw cookie token (raw token is never stored)
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: ts('expires_at').notNull(),
}, (t) => [index('sessions_user_idx').on(t.userId)]);

// ---------- CATALOGUE ----------
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  description: text('description').notNull(),
  priceKobo: bigint('price_kobo', { mode: 'number' }).notNull(),
  category: text('category', { enum: ['dress', 'sport', 'classic', 'smart'] }).notNull(),
  movement: text('movement'),
  caseSizeMm: integer('case_size_mm'),
  strap: text('strap'),
  waterResistance: text('water_resistance'),
  imageUrl: text('image_url').notNull(),
  gallery: text('gallery').array().notNull().default(sql`'{}'::text[]`),
  stock: integer('stock').notNull().default(0),
  featured: boolean('featured').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [
  check('products_stock_nonneg', sql`${t.stock} >= 0`),
  check('products_price_nonneg', sql`${t.priceKobo} >= 0`),
  index('products_category_idx').on(t.category),
  index('products_active_created_idx').on(t.isActive, t.createdAt),
]);

// ---------- ORDERS ----------
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: text('order_number').notNull().unique(),   // e.g. MT-7K2Q9X, generated in code
  userId: uuid('user_id').notNull().references(() => users.id),
  status: text('status', { enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] })
    .notNull().default('pending'),
  paymentMethod: text('payment_method', { enum: ['pay_on_delivery', 'bank_transfer'] }).notNull(),
  subtotalKobo: bigint('subtotal_kobo', { mode: 'number' }).notNull(),
  shippingKobo: bigint('shipping_kobo', { mode: 'number' }).notNull(),
  totalKobo: bigint('total_kobo', { mode: 'number' }).notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  notes: text('notes'),
  emailSentAt: ts('email_sent_at'),            // null = confirmation email not (yet) sent
  createdAt: ts('created_at').notNull().defaultNow(),
}, (t) => [
  index('orders_user_idx').on(t.userId, t.createdAt),
  index('orders_status_idx').on(t.status, t.createdAt),
]);

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),       // snapshot
  imageUrl: text('image_url'),                       // snapshot
  unitPriceKobo: bigint('unit_price_kobo', { mode: 'number' }).notNull(), // snapshot
  quantity: integer('quantity').notNull(),
}, (t) => [
  check('order_items_qty_pos', sql`${t.quantity} > 0`),
  index('order_items_order_idx').on(t.orderId),
]);

// ---------- RELATIONS ----------
export const usersRelations = relations(users, ({ many }) => ({ orders: many(orders), sessions: many(sessions) }));
export const sessionsRelations = relations(sessions, ({ one }) => ({ user: one(users, { fields: [sessions.userId], references: [users.id] }) }));
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
