# Milestone Reviews

## Milestone 0: Scaffold

### What was implemented
- Initialized Next.js 16 App Router project with TypeScript, Tailwind CSS, and `src/` directory layout.
- Installed and configured core dependencies:
  - Database: `drizzle-orm`, `@neondatabase/serverless`, `ws`, `drizzle-kit`, `tsx`, `@types/ws`
  - Authentication: `arctic`, `server-only`
  - Client state & data fetching: `zustand`, `@tanstack/react-query`
  - Form validation: `zod`, `react-hook-form`, `@hookform/resolvers`
  - UI & Icons: `lucide-react`, `sonner`, `clsx`, `tailwind-merge`, `class-variance-authority`, `components.json` for shadcn
- Configured editorial luxury design system tokens in `src/app/globals.css` (`--ink`, `--charcoal`, `--ivory`, `--sand`, `--gold`, `--gold-deep`, `--muted`, `--success`, `--warning`, `--danger`).
- Configured typography via Google Fonts in `src/app/layout.tsx`: Cormorant Garamond for headings and Inter for body copy.
- Created central business and commerce configuration in `src/config/brand.ts` and `src/config/shop.ts`.
- Created currency utility `src/lib/money.ts` strictly handling money as integer kobo and formatting to NGN via `formatNaira()`.
- Set up Drizzle database schema, client, and seed script in `src/server/db/`:
  - `src/server/db/schema.ts` (users, sessions, products, orders, order_items with DB CHECK constraints and indexes)
  - `src/server/db/index.ts` (WebSocket Pool driver with `import 'server-only'`)
  - `src/server/db/seed.ts` (standalone runner with conflict-handling inserts)
  - `drizzle.config.ts` configured for PostgreSQL dialect pointing to `src/server/db/schema.ts`
- Added project npm scripts in `package.json` (`dev`, `build`, `lint`, `db:push`, `db:seed`).
- Created `.env.example` documenting all required secrets and configuration keys.
- Configured `next.config.ts` with `images.remotePatterns` for `images.unsplash.com`.
- Added test bench on landing page (`src/app/page.tsx`) verifying token application, font variables, and currency formatting.
- Executed `npm run db:push` and `npm run db:seed` against live Neon PostgreSQL instance.
- Verified that `npm run build` and `npm run lint` compile cleanly with zero errors.

### Challenges
- **Project-scoped script restrictions (`allow-scripts`)**: The host environment npm configuration had `allow-scripts = ["electron"]`, which caused standard `npm install` and CLI scaffolders (such as `create-next-app` and `shadcn init`) to exit with `EALLOWSCRIPTS`. Resolved by running package installations with `--ignore-scripts` and manually configuring the required shadcn configuration (`components.json` and `src/lib/utils.ts`).
- **`server-only` conflict with tsx script**: Standalone Node scripts executed by `tsx` (like `db:seed`) cannot resolve Next.js's `'server-only'` package. Resolved by keeping `import 'server-only'` in `src/server/db/index.ts` for strict Next.js API/server component protection, while setting up `src/server/db/seed.ts` with a direct connection pool.
- **ESLint 9 Flat Config in Next.js 16**: Next 16 deprecated `next lint`. Standard FlatCompat configurations failed due to circular references in legacy plugins. Solved cleanly with native ESLint flat config using direct exports from `eslint-config-next`.

### Improvements
- In M1, implement the Arctic Google OAuth handler with PKCE and state verification, database session store, and authentication guards.
- Connect Mailgun keys when ready to test real confirmation emails.

### Decisions and assumptions
- Used Tailwind CSS v4 `@theme` directive to map `--color-*` and `--font-*` tokens directly to CSS variables, ensuring full compatibility with Next.js 16 while honoring the exact color hex codes and font pairings from `04_DESIGN_SYSTEM.md`.
- Stored all initial watch catalogue seed data in `src/server/db/seed.ts` using 8 watches spanning dress, sport, classic, and smart categories with realistic kobo amounts.
- Established `src/server/` as the dedicated home for all backend services, database operations, and external API integrations.
- Configured Next.js 16 (`^16.3.8`) with native ESLint 9 flat configuration (`eslint .`), preserving full compatibility with Tailwind CSS v4, shadcn/ui, and React 19.

## Milestone 1: Authentication & Brand Experience

### What was implemented
- **Arctic Google OAuth Client**: Configured Arctic Google OAuth client with PKCE S256 and OpenID Connect scopes (`openid`, `profile`, `email`) in `src/server/auth/google.ts`.
- **Database-Backed Session Store**: Implemented `createSession`, `validateSession`, and `deleteSession` in `src/server/auth/session.ts` with SHA-256 token hashing, 30-day expiration, and automatic session rolling for active users within 15 days of expiration.
- **Server Auth Guards**: Implemented `getCurrentUser` (React `cache()` memoized), `requireUser()`, and `requireAdmin()` with strict `AuthError` typing (401/403) in `src/server/auth/guards.ts`.
- **API Route Handlers**:
  - `GET /api/auth/google`: Initiates OAuth, generates cryptographically secure state & code verifier, sanitizes `next` redirect target, and sets 10-minute HTTP-only cookies.
  - `GET /api/auth/google/callback`: Validates state against cookie (rejecting tampered states with 400), exchanges code via PKCE, decodes Google ID token claims, enforces verified email addresses, matches `ADMIN_EMAILS` to grant admin role, upserts user in Neon, issues session cookie, and cleans up transient OAuth cookies.
  - `POST /api/auth/logout`: Clears session cookie and deletes session record from Neon PostgreSQL.
- **Edge-Safe Route Protection**: Configured `src/middleware.ts` to protect `/checkout`, `/orders`, `/order-confirmation/*`, and `/admin/*` by redirecting unauthenticated users to `/login?next=<path>`.
- **Editorial Brand UI & Assets**:
  - Generated bespoke commercial photography assets: `/public/images/hero-watch.jpg` (Meridian Time engraved tourbillon) and `/public/images/craftsmanship.jpg` (artisan horologist atelier).
  - Built luxury `/login` portal with Google OAuth button and error alert banners.
  - Built persistent luxury `Header` with brand logo and `AccountMenu` (avatar, role badge, orders link, and sign-out action).
  - Built full luxury `Footer` with trust strip, authenticity warranty, nationwide shipping, and WhatsApp concierge.
  - Transformed `/` into an editorial luxury landing page querying active watches directly from Neon.
  - Built protected `/admin` and `/orders` placeholder views.

### Challenges
- **Next.js 16 SearchParams Asynchronous Resolution**: In Next.js 16 App Router, `searchParams` in server components is a Promise. Solved by `await searchParams` in `src/app/login/page.tsx` for type-safe parameter extraction.
- **State Tampering Security**: Ensured state comparison returns HTTP 400 with a structured `{ error: { code, message } }` payload on any state mismatch or missing cookies.

### Improvements
- In M2 (Catalogue), implement `/shop` page with dynamic category filtering, price sorting, search, and individual product detail pages (`/shop/[slug]`).

### Decisions and assumptions
- Generated real, bespoke luxury watch imagery featuring the brand name for hero and craftsmanship sections rather than generic placeholders.
- Used direct SVG Google branding for the OAuth button to ensure crisp rendering across high-DPI screens.

## Milestone 2: Catalogue & Marketplace

### What was implemented
- **Catalogue API (`GET /api/products`)**: Filterable, searchable, and paginated endpoint querying active products in Neon using Drizzle ORM. Supports filtering by `category`, `q` (`ilike` on name, brand, description), `minPrice` / `maxPrice` (in kobo), `inStock` boolean, and sorting by `newest`, `price_asc`, or `price_desc`.
- **Client Data Fetching (`src/hooks/useProducts.ts`)**: TanStack React Query hook with automatic 60-second cache invalidation and serialized query keys.
- **Client Providers (`src/components/providers.tsx`)**: Configured global `QueryClientProvider` with dark luxury `Toaster` from `sonner`.
- **Marketplace Interface (`src/app/shop/page.tsx`)**:
  - Refined filter sidebar with category pills, price spectrum presets, and in-stock toggle.
  - Debounced real-time search and sort dropdown.
  - Responsive grid layout (1 col mobile, 2 col tablet, 3 col desktop) with `ProductCard`.
  - Empty state with reset CTA and shimmer loading states with `ProductGridSkeleton`.
  - URL parameter synchronization for direct linking (e.g. `/shop?category=sport`).
- **Product Card (`src/components/shop/ProductCard.tsx`)**: Displays product image with hover zoom, category badge, stock badges (`In Stock`, `Only X Left`, `Out of Stock`), movement pill, and formatted Naira pricing.
- **Product Detail Page (`src/app/shop/[slug]/page.tsx`)**:
  - Dynamic SEO metadata generation via `generateMetadata`.
  - Server Component querying Neon with 404 (`notFound()`) handling for inactive/missing slugs.
  - Interactive client gallery with thumbnail switcher (`ProductDetailClient.tsx`).
  - Full horology specification matrix (movement, case diameter, strap, water resistance).
  - Quantity selector, Add to Bag action, and direct WhatsApp Concierge inquiry link.
  - Related timepieces section showcasing 4 matching calibers from the same category.

### Challenges
- **Eliminating Cascading Renders**: ESLint flagged a potential cascading render warning when syncing URL search parameters to state within `useEffect`. Solved by directly deriving the active category from `searchParams` and passing an explicit filter updater that updates URL and query state synchronously.

### Improvements
- In M3 (Cart), implement the Zustand persisted cart store (`src/store/cart.ts`), cart drawer component, and `/cart` page with stock validation.

### Decisions and assumptions
- Implemented `ProductDetailClient` as a focused client component for image gallery selection and quantity controls while keeping the outer `shop/[slug]/page.tsx` as a pure Server Component for maximum SEO and performance.



## Milestone 3: Shopping Cart & Drawer

### What was implemented
- **Persisted Zustand Cart Store (`src/store/cart.ts`)**:
  - Configured Zustand store with `persist` middleware targeting `localStorage` (`meridian-cart`).
  - Stock-guarded state mutations: `add()` and `setQty()` strictly clamp quantities to `product.stock`.
  - Derived selectors: `selectCartCount`, `selectCartSubtotal`, `selectCartShippingFee`, `selectCartTotal`, and `selectFreeShippingProgress`.
  - Configured reactive nationwide shipping calculations: free shipping above `SHOP.freeShippingThresholdKobo` (₦1,000,000), otherwise standard fee `SHOP.shippingFeeKobo` (₦5,000).
- **Hydration-Safe Client Mounting (`src/hooks/useIsMounted.ts`)**:
  - Built a zero-overhead `useIsMounted` hook using React's `useSyncExternalStore(emptySubscribe, () => true, () => false)` to prevent hydration mismatches and comply with React 19/ESLint rules.
- **Cart Slide-Over Drawer (`src/components/cart/CartDrawer.tsx`)**:
  - Animated right-side slide-over drawer with backdrop blur.
  - Dynamic free shipping progress bar showing kobo remaining until complimentary courier dispatch.
  - Item list with product image, caliber name, category, unit price, quantity stepper with disabled controls at stock limit ("Max stock" indicator), and instant item removal.
  - Subtotal and estimated shipping breakdown, with a primary "Proceed to Checkout" action button.
- **Cart Icon Badge (`src/components/cart/CartIconBadge.tsx`)**:
  - Live animated item count badge embedded in the global `Header`.
- **Full Cart View (`src/app/cart/page.tsx`)**:
  - Dedicated `/cart` route with responsive layout (compact card view on mobile, structured horological table on desktop).
  - Quantity controls, live price updates, order summary sidebar, and curated empty bag state with direct CTA back to the marketplace.
- **Interactive Storefront Integration**:
  - Connected `ProductCard` "Add to Bag" quick action button.
  - Connected `ProductDetailClient` quantity selector and "Add to Bag" button with automated drawer opening.

### Challenges
- **React 19 / ESLint `react-hooks/set-state-in-effect`**: Setting `mounted = true` in a `useEffect` triggers an ESLint warning for synchronous cascading renders in React 19. Solved by replacing state-based mount tracking with `useSyncExternalStore`, guaranteeing safe server/client synchronization with zero extra re-renders.
- **`getServerSnapshot` non-primitive selector reference**: Passing a selector that returns a newly instantiated object (`selectFreeShippingProgress`) caused React's `useSyncExternalStore` in Next.js 16 to detect unstable snapshots across renders ("The result of getServerSnapshot should be cached to avoid an infinite loop"). Solved by selecting the primitive `subtotalKobo` and deriving progress via `getFreeShippingProgress(subtotalKobo)`.

### Improvements
- In M4 (Checkout & Orders), build the single-transaction order placement (`db.transaction()`), address form with Nigerian state validation, dynamic Pay on Delivery check, Mailgun confirmation email, and order confirmation receipt.

### Decisions and assumptions
- Added a visual drawer slide-in upon adding items from both the catalogue card and the detail view to provide immediate confirmation without intrusive modal dialogs.
- Enforced hard stock limits directly in the Zustand store as well as the UI buttons to prevent users from placing unavailable inventory in the cart.

## Milestone 4: Checkout, Orders & Email Confirmation

### What was implemented
- **Zod Order Validation (`src/lib/validators.ts`)**:
  - Validated order items (`uuid`, `quantity` integer 1..10), shipping address (Nigerian phone format, address, city, state in `SHOP.nigerianStates`, optional notes max 500 chars).
  - Enforced dynamic Pay on Delivery rule via `superRefine`: if `paymentMethod === 'pay_on_delivery'`, `shipping.state` must pass `isPayOnDeliverySupported()`.
  - Defined client checkout schema `checkoutFormSchema` and types `CheckoutFormData`, `CreateOrderInput`.
- **Atomic Order Transaction Service (`src/server/orders/index.ts`)**:
  - Implemented `createOrder()` wrapped in a single ACID `db.transaction()` on `@neondatabase/serverless` WebSocket Pool.
  - Generates bespoke order numbers (e.g. `MT-7K2Q9X`) via cryptographically secure random bytes.
  - Re-reads prices from database (never trusting client-submitted prices or totals).
  - Deduplicates items and decrements inventory atomically with conditional SQL check (`gte(products.stock, it.quantity)`), rolling back and throwing `OrderError('OUT_OF_STOCK')` if insufficient stock.
  - Inserts into `orders` and creates immutable line snapshots in `order_items`.
  - Implemented `cancelOrder(orderId)`: transaction that restores inventory and sets status to `cancelled`.
  - Implemented `getOrder(orderNumber, userId, isAdmin)` with strict multi-tenant authorization guards.
  - Implemented `getUserOrders(userId)` returning user orders with line items.
- **Mailgun Email Integration & Branded Templates (`src/server/email/`)**:
  - `src/server/email/mailgun.ts`: HTTP Basic auth Mailgun client using native `fetch`.
  - `src/server/email/templates.ts`: HTML + plain-text fallback templates with escaped user inputs, dark luxury branding, order summary table, shipping details, and direct bank wire instructions (when applicable).
  - Optional business owner alert when `OWNER_NOTIFY_EMAIL` is set.
  - Protected by non-blocking error handling: failed email delivery logs an error and leaves `emailSentAt` null without failing the customer order transaction.
- **API Endpoints**:
  - `POST /api/orders`: Authenticated order creation with `Origin` CSRF validation, session-derived email (never request body), Zod validation, order transaction, non-blocking email dispatch, and HTTP 201 response.
  - `GET /api/orders`: Authenticated user orders query.
  - `GET /api/orders/[orderNumber]`: Authenticated order lookup with 404 security checks for unauthorized viewers.
- **Interactive Checkout Interface (`src/app/checkout/`)**:
  - `CheckoutForm.tsx`: React Hook Form with Zod resolver, Google prefilled contact information, read-only session email with security lock, state select dropdown, dynamic Pay on Delivery availability pill and fallback to Bank Transfer, order summary with live item previews, and submit state locking.
  - Server Component `page.tsx` with authentication guard redirecting unauthenticated users to `/login?next=/checkout`.
- **Order Confirmation Receipt (`src/app/order-confirmation/[orderNumber]/`)**:
  - Server-rendered luxury receipt verifying order ownership.
  - Order reference, placement date, status pill, payment method breakdown.
  - Prominent wire transfer coordinates card with account number and reference when bank transfer is chosen.
  - Purchased timepieces with snapshots, quantity, unit price, subtotal, insured shipping fee, and total.
  - Courier dispatch destination card and direct WhatsApp concierge assistance link.
- **Client Orders Hub (`src/app/orders/`)**:
  - Replaced placeholder with full responsive orders dashboard.
  - Desktop table and mobile card views showcasing order number, date, item thumbnails, payment method, total, status badge, and receipt links.
  - Curated empty state with direct CTA to the horological collection.
- **Design System Components (`src/components/ui/StatusBadge.tsx`)**:
  - Canonical badge mapping for `pending` (warning), `confirmed` (gold), `shipped` (ink), `delivered` (success), and `cancelled` (danger).

### Challenges
- **`AuthError` property alignment**: `AuthError` in `src/server/auth/guards.ts` defined `statusCode` rather than `status`. Fixed across all API route handlers to return the appropriate 401/403 HTTP response.
- **Testing against `server-only` constraints**: Directly importing `src/server/orders` into a standalone Node test runner triggered Next.js's `'server-only'` guard. Solved by testing the atomic transaction logic directly with the Neon WebSocket Pool driver.

### Improvements
- In M5 (Admin), implement `/admin` dashboard with aggregated metrics (total orders, pending count, non-cancelled revenue), paginated/filterable orders table, order detail view, and status updater (`PATCH /api/admin/orders/[id]`) that invokes `cancelOrder()` to automatically restock items when cancelled.

### Decisions and assumptions
- For Pay on Delivery, if the user changes their delivery state to an unsupported region, the form dynamically switches the payment selection to Direct Bank Transfer with clear feedback explaining the constraint.
- Order confirmation page is accessible to both the order owner and administrators, returning a strict 404 to any other user.

## Milestone 5: Admin Operations Console

### What was implemented
- **Admin Backend Services (`src/server/orders/index.ts`)**:
  - `getAdminStats()`: Computes total order count, pending fulfillment count, and gross non-cancelled revenue in kobo.
  - `getAdminOrders(statusFilter)`: Queries all customer orders with joined line-item snapshots, with optional status filtering (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`).
  - `updateOrderStatus(orderId, newStatus)`: Atomically updates an order's lifecycle. When status is transitioned to `cancelled`, delegates to `cancelOrder()` to automatically restock all order items in active product inventory.
- **Admin API Route Handlers (`src/app/api/admin/orders/`)**:
  - `GET /api/admin/orders`: Secured with `requireAdmin()`. Supports status filtering via search parameters and returns orders list and operational statistics.
  - `PATCH /api/admin/orders/[id]`: Secured with `requireAdmin()`. Validates status updates with Zod and returns the updated order entity. Non-admins receive HTTP 403; unauthenticated users receive HTTP 401.
- **Client State & Data Fetching (`src/hooks/useAdminOrders.ts`)**:
  - `useAdminOrders(statusFilter)`: TanStack Query hook with automated stale-time caching.
  - `useUpdateOrderStatus()`: TanStack Mutation with automated query cache invalidation and toast feedback upon status update.
- **Interactive Admin Operations Console (`src/components/admin/AdminDashboardClient.tsx`)**:
  - High-level metric cards: Total Revenue (formatted via `formatNaira()`), Total Orders, and Pending Orders with urgency indicator.
  - Status pill filter navigation for switching views across order lifecycles.
  - Client-side search filtering by order reference, customer name, email, or city.
  - Responsive table with interactive status dropdowns enabling immediate status changes.
  - Slide-over order detail inspection drawer with client contacts, delivery address, timepieces acquired, line totals, cancellation warning, and link to public receipt.
- **Route Authorization & Security**:
  - Enforced server-side gate in `src/app/admin/page.tsx`: unauthenticated users are redirected to `/login?next=/admin`, and non-admin authenticated users receive a 404 (`notFound()`) to avoid revealing internal routes.

### Challenges
- **Authorization UX vs Security**: PRD specified that non-admin users should get a 404 on the admin page to conceal administrative endpoints. Solved by catching unauthorized users in `src/app/admin/page.tsx` and calling Next.js's native `notFound()` while maintaining HTTP 403 on API endpoints.

### Improvements
- In M6 (Landing + Polish), build out additional editorial landing sections, dynamic OpenGraph/metadata tags, favicon, custom error and not-found boundaries, and complete a responsive/accessibility pass.

### Decisions and assumptions
- Marked orders as restocked only when transitioning to `cancelled`, preserving inventory deductions while orders remain in `pending`, `confirmed`, `shipped`, or `delivered`.
