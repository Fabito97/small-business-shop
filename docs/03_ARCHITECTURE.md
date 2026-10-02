# Architecture

## Folder structure
```
src/
├─ app/
│  ├─ layout.tsx                 # fonts, Providers (QueryClient, Toaster), Header, Footer, CartDrawer
│  ├─ page.tsx                   # landing
│  ├─ shop/page.tsx              # marketplace (client filters + useProducts)
│  ├─ shop/[slug]/page.tsx       # product detail (server component)
│  ├─ cart/page.tsx
│  ├─ checkout/page.tsx
│  ├─ order-confirmation/[orderNumber]/page.tsx
│  ├─ orders/page.tsx
│  ├─ login/page.tsx
│  ├─ admin/page.tsx
│  ├─ admin/orders/[id]/page.tsx
│  └─ api/
│     ├─ auth/google/route.ts            # GET: start OAuth
│     ├─ auth/google/callback/route.ts   # GET: finish OAuth, create session
│     ├─ auth/logout/route.ts            # POST
│     ├─ products/route.ts               # GET list w/ filters
│     ├─ orders/route.ts                 # POST create order (+ email), GET my orders
│     ├─ orders/[orderNumber]/route.ts   # GET single (owner/admin)
│     ├─ admin/orders/route.ts           # GET all (admin)
│     └─ admin/orders/[id]/route.ts      # PATCH status (admin)
├─ components/ (layout/, shop/, cart/, checkout/, admin/, ui/)
├─ config/ (brand.ts, shop.ts)         # shop.ts: currency, shipping fee, free threshold, bank details, NG states
├─ db/ (index.ts, schema.ts, seed.ts)
├─ lib/
│  ├─ auth/session.ts            # create/validate/delete sessions, cookie helpers
│  ├─ auth/google.ts             # Arctic Google client
│  ├─ auth/guards.ts             # getCurrentUser, requireUser, requireAdmin
│  ├─ orders.ts                  # createOrder, cancelOrder, queries
│  ├─ email/mailgun.ts + templates.ts
│  ├─ money.ts, validators.ts
├─ hooks/                        # useProducts, useMyOrders, useAdminOrders, useUpdateOrderStatus
├─ store/cart.ts
├─ types/index.ts
└─ middleware.ts                 # cookie-presence redirect only
```

## Environment variables (`.env.example`)
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=                       # Neon POOLED connection string (server only)

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_EMAILS=you@example.com,brother@example.com   # comma-separated

MAILGUN_API_KEY=
MAILGUN_DOMAIN=                     # sandboxXXXX.mailgun.org or mg.yourdomain.com
MAILGUN_FROM="Meridian Time <postmaster@MAILGUN_DOMAIN>"
MAILGUN_BASE_URL=https://api.mailgun.net   # EU: https://api.eu.mailgun.net
OWNER_NOTIFY_EMAIL=                 # optional
```

## Auth implementation (Google OAuth + DB sessions)

**`lib/auth/google.ts`**
```ts
import { Google } from 'arctic';
export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!, process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback`,
);
```

**`GET /api/auth/google`**: `state = generateState()`, `verifier = generateCodeVerifier()`, `url = google.createAuthorizationURL(state, verifier, ['openid','profile','email'])`. Set short-lived (10 min) httpOnly cookies `g_state`, `g_verifier`, `g_next` (sanitised: must start with `/` and not `//`; default `/`). Redirect to `url`.

**`GET /api/auth/google/callback`**
1. Read `code`, `state` from the query; compare `state` to the `g_state` cookie; abort → redirect `/login?error=oauth` on mismatch.
2. `tokens = await google.validateAuthorizationCode(code, verifier)`; `claims = decodeIdToken(tokens.idToken())` (from `arctic`) → `sub, email, email_verified, name, picture`. Reject if email not verified.
3. Upsert into `users` on `googleId` (update name/avatar/email). Role: if `email` is in `ADMIN_EMAILS` (lowercased compare) set `role='admin'`, otherwise leave as is.
4. Create a session (below), set the cookie, clear the `g_*` cookies, redirect to `g_next`.

**`lib/auth/session.ts`**
```ts
import { createHash, randomBytes } from 'node:crypto';
const COOKIE = 'session';
const DAYS = 30;
const hash = (t: string) => createHash('sha256').update(t).digest('hex');

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + DAYS * 864e5);
  await db.insert(sessions).values({ id: hash(token), userId, expiresAt });
  return { token, expiresAt };
}
// cookie: httpOnly, sameSite:'lax', secure: NODE_ENV==='production', path:'/', expires: expiresAt
export async function validateSession(token: string) {
  // select user + session where sessions.id = hash(token) and expiresAt > now(); return user | null
}
export async function deleteSession(token: string) { /* delete where id = hash(token) */ }
```

**`lib/auth/guards.ts`**
```ts
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get('session')?.value;
  return token ? validateSession(token) : null;
});
export async function requireUser() { const u = await getCurrentUser(); if (!u) throw new AuthError(401); return u; }
export async function requireAdmin() { const u = await requireUser(); if (u.role !== 'admin') throw new AuthError(403); return u; }
```
Pages: catch and `redirect('/login?next=...')` / `notFound()`. API routes: map `AuthError` to 401/403 JSON.

**`/api/auth/logout` (POST):** delete the session row, clear the cookie, return 204.
**`middleware.ts`:** for `/checkout`, `/orders`, `/order-confirmation/*`, `/admin/*`, redirect to `/login?next=<path>` if the `session` cookie is absent. (Edge runtime can't use the DB, so this is only a UX shortcut.)
**Header** reads the user in a server component (`getCurrentUser()`) and passes it to the AccountMenu.

## Order creation, `lib/orders.ts`
```ts
export class OrderError extends Error { constructor(public code: 'EMPTY_CART'|'PRODUCT_UNAVAILABLE'|'OUT_OF_STOCK', msg: string) { super(msg) } }

export async function createOrder(userId: string, input: ValidatedOrderInput) {
  return db.transaction(async (tx) => {
    const ids = input.items.map(i => i.productId);
    const rows = await tx.select().from(products).where(and(inArray(products.id, ids), eq(products.isActive, true)));
    const byId = new Map(rows.map(r => [r.id, r]));
    let subtotal = 0; const lines = [];
    for (const it of input.items) {                       // items already de-duplicated
      const p = byId.get(it.productId);
      if (!p) throw new OrderError('PRODUCT_UNAVAILABLE', 'An item is no longer available');
      const ok = await tx.update(products).set({ stock: sql`${products.stock} - ${it.quantity}` })
        .where(and(eq(products.id, p.id), gte(products.stock, it.quantity))).returning({ id: products.id });
      if (ok.length === 0) throw new OrderError('OUT_OF_STOCK', `${p.name} doesn't have enough stock`);
      subtotal += p.priceKobo * it.quantity;
      lines.push({ productId: p.id, productName: p.name, imageUrl: p.imageUrl, unitPriceKobo: p.priceKobo, quantity: it.quantity });
    }
    const shipping = subtotal >= SHOP.freeShippingThresholdKobo ? 0 : SHOP.shippingFeeKobo;
    const [order] = await tx.insert(orders).values({
      orderNumber: makeOrderNumber(),                     // 'MT-' + 6 chars from 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      userId, paymentMethod: input.paymentMethod,
      subtotalKobo: subtotal, shippingKobo: shipping, totalKobo: subtotal + shipping,
      customerName: input.shipping.name, customerEmail: input.email, customerPhone: input.shipping.phone,
      shippingAddress: input.shipping.address, city: input.shipping.city, state: input.shipping.state, notes: input.shipping.notes,
    }).returning();
    await tx.insert(orderItems).values(lines.map(l => ({ ...l, orderId: order.id })));
    return { order, items: lines };
  });
}
```
`cancelOrder(orderId)`: transaction that returns early if already cancelled, adds each item's quantity back to `products.stock` (where `productId` not null), and sets status `cancelled`.

## Cart store (Zustand), `store/cart.ts`
```ts
type CartItem = { productId: string; slug: string; name: string; image: string; priceKobo: number; quantity: number; stock: number };
type CartState = { items: CartItem[]; isOpen: boolean;
  add(item: Omit<CartItem,'quantity'>, qty?: number): void;   // merges, caps at stock
  setQty(productId: string, qty: number): void;               // removes if 0
  remove(productId: string): void; clear(): void; open(): void; close(): void; };
// persist({ name: 'cart-v1', partialize: s => ({ items: s.items }) }); selectors: count, subtotal
```
Guard badges/counts with a `mounted` flag to avoid hydration mismatch. Cart prices are display-only.

## React Query
- `QueryClientProvider` in `Providers`, `staleTime: 60_000`.
- `useProducts(filters)` → `['products', filters]`; `useMyOrders()`; `useAdminOrders(status?)`; `useUpdateOrderStatus()` mutation (invalidates admin orders).
- Place order = `useMutation` in CheckoutForm; on success `cart.clear()` + `router.push`.
- Product detail and landing featured products are **server-fetched with Drizzle** for SEO/speed.

## API contracts
**`GET /api/products`**: query `category?, q?, minPrice?, maxPrice? (kobo), sort? (newest|price_asc|price_desc), page?, limit? (12)` → `{ items, total, page, pageCount }`. Only `isActive` products. `q` = `ilike` on name/brand.

**`POST /api/orders`** (auth)
```jsonc
{ "items": [{ "productId": "uuid", "quantity": 1 }],
  "shipping": { "name": "", "phone": "", "address": "", "city": "", "state": "", "notes": "" },
  "paymentMethod": "pay_on_delivery" }   // | "bank_transfer"
// 201 { "orderNumber": "MT-7K2Q9X" }   errors: 400 validation, 401, 409 { code, message }, 500
```
Flow: `requireUser()` (email from **session**, never the body) → zod validate (merge duplicate productIds, ≤20 items, qty ≤10) → `createOrder()` (map `OrderError` → 409/400) → build email → `try { await sendEmail(...); update orders set emailSentAt = now() } catch { console.error }` → return orderNumber.

**`GET /api/orders`**: current user's orders. **`GET /api/orders/[orderNumber]`**: order + items; where `userId = me` unless admin; otherwise 404.
**`GET /api/admin/orders?status=`** (admin). **`PATCH /api/admin/orders/[id]`** `{ status }` (admin); `cancelled` → `cancelOrder()`.

## Mailgun, `lib/email/mailgun.ts`
```ts
export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const form = new FormData();
  form.append('from', process.env.MAILGUN_FROM!); form.append('to', to);
  form.append('subject', subject); form.append('html', html); form.append('text', text);
  const res = await fetch(`${process.env.MAILGUN_BASE_URL}/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from('api:' + process.env.MAILGUN_API_KEY).toString('base64') },
    body: form,
  });
  if (!res.ok) throw new Error(`Mailgun ${res.status}: ${await res.text()}`);
}
```
Templates: table-based HTML, inline styles, 600px, brand colors; **escape all user-provided strings**.

## Security checklist
- `session` cookie: httpOnly, Secure (prod), SameSite=Lax; only the **hash** is stored in DB.
- OAuth `state` + PKCE verified; `next` redirect sanitised; `email_verified` required.
- POST/PATCH routes rely on SameSite=Lax; also check the `Origin` header equals the site origin.
- Server recomputes prices; zod on every input; `server-only` on secret-touching modules.
- **Verify manually:** user A cannot read user B's order; non-admin gets 403 on every admin route.

## next.config
`images.remotePatterns`: `images.unsplash.com` (+ any future image host).
