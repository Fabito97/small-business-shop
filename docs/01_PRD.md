# Product Requirements

**Product:** Online storefront for a watch retailer (placeholder brand: **Meridian Time**, configurable).
**Audience:** Style-conscious buyers in Nigeria (prices in NGN ₦), mostly on mobile.
**Goal:** A trustworthy, premium-feeling shop where someone can browse, sign in with Google, check out, and get a confirmation email, and where the owner can see orders.

## Roles
- **Visitor:** can browse landing, marketplace, product pages, and use the cart. Must sign in to check out.
- **Customer:** signed in with Google. Can check out and view their own orders.
- **Admin:** a customer with `role = 'admin'`. Can view all orders and update status.

## Pages and routes

| Route | Page | Access |
|---|---|---|
| `/` | Landing | public |
| `/shop` | Marketplace | public |
| `/shop/[slug]` | Product detail | public |
| `/cart` | Full cart page | public |
| `/checkout` | Checkout | **auth required** (redirect to `/login?next=/checkout`) |
| `/order-confirmation/[orderNumber]` | Confirmation | auth, owner only (or admin) |
| `/orders` | My orders list | auth |
| `/login` | Google sign-in | public |
| `/admin` | Orders dashboard | admin only |
| `/admin/orders/[id]` | Order detail + status update | admin only |
| `/api/auth/google` | Starts Google OAuth (route handler) | public |
| `/api/auth/google/callback` | Google OAuth callback (route handler) | public |
| `/api/auth/logout` | POST: destroys session | auth |

Global: header (logo, nav: Shop, cart icon with count badge, account menu / Sign in), footer, cart drawer (shadcn Sheet).

## 1. Landing page `/`
Sections, in order:
1. **Hero:** full-width, large headline, sub-copy, primary CTA "Shop the Collection" → `/shop`, secondary "Our Story" (scroll to about).
2. **Featured watches:** 4 products where `featured = true` (card grid).
3. **Shop by category:** tiles for Dress, Sport, Classic, Smart → `/shop?category=...`
4. **Why us / trust strip:** 3-4 items (Authentic guarantee, 12-month warranty, Nationwide delivery, Easy support). Icons + short text.
5. **About snippet:** short brand story (placeholder copy, in config).
6. **Newsletter or contact CTA:** simple WhatsApp / email link (NO newsletter backend).
7. Footer.

## 2. Marketplace `/shop`
- Product grid (1 col mobile, 2 tablet, 3-4 desktop). Card: image, brand, name, price, "Low stock" badge if `stock <= 3`, "Sold out" if 0, quick "Add to cart" button.
- **Filters** (URL search params so links are shareable): category, price range (min/max or presets), sort (Newest, Price low→high, Price high→low), text search by name/brand.
- Data via React Query (`useProducts(filters)`) hitting `GET /api/products`.
- Loading skeletons, empty state ("No watches match your filters" + clear filters button).
- Simple pagination or "Load more" (12 per page). Keep it simple.

## 3. Product detail `/shop/[slug]`
- Image gallery (main image + thumbnails), name, brand, price, description, spec table (movement, case size, strap, water resistance), stock status.
- Quantity selector (1 to min(stock, 5)), "Add to cart" button, "Buy now" (adds + goes to checkout).
- "You may also like": 4 other products from same category.
- Server-rendered for SEO, with `generateMetadata`.

## 4. Cart (Zustand + persisted)
- Drawer opens on add-to-cart; `/cart` page shows the same data larger.
- Per line: image, name, unit price, quantity stepper, remove, line total.
- Summary: subtotal, shipping (flat fee; free above threshold, from config), total.
- Quantity capped by product stock (store `stock` snapshot in cart item; server re-validates).
- Empty state with CTA to `/shop`.
- CTA "Checkout": if not signed in, send to login with `next=/checkout`.
- Cart persists across reloads. Cleared after successful order.

## 5. Checkout `/checkout`
Two-column (stacks on mobile): form left, order summary right.

**Form fields** (react-hook-form + zod):
- Full name (prefilled from Google), Email (prefilled, read-only), Phone (Nigerian format, validate loosely), Address, City, State (select of Nigerian states), Delivery notes (optional).
- **Payment method** radio: `Pay on delivery` or `Bank transfer` (instructions shown from config). No real payment gateway.
- Submit "Place Order".

**On submit:**
1. Client posts `{ items: [{productId, quantity}], shipping: {...}, paymentMethod }` to `POST /api/orders`.
2. Server validates session + zod, calls `createOrder()` (one DB transaction: re-prices from DB, checks/decrements stock).
3. Server sends confirmation email via Mailgun (non-blocking for failure).
4. Returns `{ orderNumber }`. Client clears cart and routes to `/order-confirmation/[orderNumber]`.
- Handle errors: out of stock (show which item, offer to adjust cart), validation errors inline, generic failure toast. Disable button while submitting (prevent double orders).
- If cart empty → redirect to `/cart`.

## 6. Order confirmation `/order-confirmation/[orderNumber]`
- Success state: check icon, "Thank you, {firstName}!", order number, status, date.
- Items list, totals, shipping address, payment method (+ bank transfer instructions if relevant).
- "A confirmation email has been sent to {email}".
- CTAs: Continue shopping, View my orders.

## 7. My orders `/orders` (small)
Table/list: order number, date, total, status badge → links to confirmation page (reused as detail view).

## 8. Admin dashboard `/admin` (tiny)
- Gate: server-side check `users.role = 'admin'`, else 404/redirect.
- Stat cards: total orders, pending orders, total revenue (non-cancelled).
- Orders table (newest first): order number, customer, total, payment method, status, date. Filter by status. Row → detail.
- Detail: customer info, items, address, **status dropdown** (`pending, confirmed, shipped, delivered, cancelled`) saved via `PATCH /api/admin/orders/[id]`.
- Cancelling an order restocks items (handled by `cancelOrder()` transaction; nice-to-have).
- Data via React Query.

## 9. Auth (own implementation, Google only)
- `/login` has one "Continue with Google" link → `/api/auth/google?next=/checkout`.
- Flow: Arctic builds the Google URL (state + PKCE) → user consents → `/api/auth/google/callback` validates state, exchanges the code, reads the ID token (`sub`, `email`, `name`, `picture`; require `email_verified`) → upserts the user → creates a session row → sets httpOnly cookie → redirects to `next`.
- Admins: any email listed in the `ADMIN_EMAILS` env var is given `role = 'admin'` at login.
- Middleware only does a cheap cookie-presence check on protected paths (redirect to `/login?next=...`). **Real authorization happens server-side** via `requireUser()` / `requireAdmin()` in pages and API routes.
- Sign out in the account menu (`POST /api/auth/logout`).

## 10. Emails (Mailgun)
**Order confirmation** (HTML + plain-text fallback), sent to the customer after order creation:
- Brand header, "Thanks for your order", order number, items table (name, qty, price), subtotal/shipping/total, delivery address, payment method (+ bank details if transfer), support contact.
- Optional: also notify the owner (`OWNER_NOTIFY_EMAIL`) with a short "New order" email. Nice for handoff, cheap to add.

## Acceptance criteria (definition of done)
- [ ] Visitor can browse, filter, and add to cart without logging in
- [ ] Cart survives refresh; quantity limits respected
- [ ] Google login works on localhost AND the deployed URL
- [ ] Placing an order creates rows in `orders` + `order_items` in Neon, decrements stock
- [ ] Confirmation email arrives (Mailgun) with correct details
- [ ] Order confirmation page shows correct data; cannot be viewed by another user
- [ ] Admin can see all orders and update status; non-admin gets blocked
- [ ] Mobile layout is clean on a 375px screen
- [ ] No secrets in client bundle; `.env.example` provided
- [ ] README with setup + deploy steps + how the owner changes brand/products
- [ ] Deployed on Vercel with working env vars
