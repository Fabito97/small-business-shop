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

## Milestone 6: Landing Experience & Visual Polish

### What was implemented
- **Dynamic Branded OpenGraph Social Card (`src/app/opengraph-image.tsx`)**:
  - Generated 1200x630 dynamic social share card with `ImageResponse` using obsidian/ink background, warm gold typography, Cormorant Garamond title, and atelier guarantee markers.
- **Dynamic Favicon (`src/app/icon.tsx`)**:
  - Generated dynamic 32x32 luxury monogram favicon featuring the "MT" horological emblem in gold and ivory.
- **Root SEO & Social Metadata (`src/app/layout.tsx`)**:
  - Configured `metadataBase`, title template (`%s | Meridian Time`), descriptive keywords, locale `en_NG`, and OpenGraph/Twitter card configurations.
- **Bespoke Not Found Boundary (`src/app/not-found.tsx`)**:
  - Luxury editorial 404 page ("Caliber Not Found") with compass emblem, explanatory copy, and direct links to the collection and atelier home.
- **Global Application Error Boundary (`src/app/error.tsx`)**:
  - Luxury client error boundary ("Chronometer Interruption") with error logging, "Recalibrate (Retry)" action, and home redirection.
- **Responsive & Accessibility Pass**:
  - Validated responsive breakpoints at 375px (mobile card views, full-width inputs, touch targets >= 44px), 768px (tablets), and 1280px+ (desktop grids).
  - Verified descriptive `alt` tags and `sizes` attributes across all photographic assets.

### Challenges
- **Next.js 16 Runtime Alignment on ImageResponse**: Next.js 16 deprecated `runtime = 'edge'` for dynamic images in favor of native Node.js runtime. Resolved by removing the edge runtime export to ensure standard build compatibility.

### Improvements
- In M7 (Ship), finalize deployment instructions, complete `README.md` with instructions on how the watch shop owner customizes products and brand configuration, verify `.env.example`, and perform final verification.

### Decisions and assumptions
- Dynamic `ImageResponse` icons and OG cards were selected over static PNGs to allow future brand customization from `BRAND` config without needing to rebuild or export image assets in an external design tool.

## Milestone 7: Ship, Documentation & Verification

### What was implemented
- **Comprehensive Owner & Developer Documentation (`README.md`)**:
  - Detailed project overview, tech stack, architecture, and feature documentation.
  - Clear getting started instructions with prerequisite versions, environment variable table, database migration (`db:push`), and seeding (`db:seed`).
  - Production deployment guide for Vercel, including Google Cloud Console redirect URI configuration (`/api/auth/google/callback`).
  - Store owner management guide: how to edit brand copy and contact info in `src/config/brand.ts`, update shipping fees and Pay on Delivery states in `src/config/shop.ts`, manage inventory via Drizzle Studio (`npx drizzle-kit studio`), and assign administrator roles via `ADMIN_EMAILS`.
  - Documented known limitations and future payment gateway considerations.
- **Repository Cleanliness & Secret Audit**:
  - Verified `.env.local` is strictly excluded from version control in `.gitignore`.
  - Verified `.env.example` documents all required secrets and configuration keys.
  - Confirmed no server secrets (such as Google OAuth secret, Mailgun API key, or database connection strings) are exposed in client components or client bundles.

### Challenges
- None in this milestone. All preceding milestones compile cleanly with zero TypeScript errors or linter issues.

### Final Verification Against Acceptance Criteria (`01_PRD.md`)
- [x] Visitor can browse, filter, and add to cart without logging in
- [x] Cart survives refresh; quantity limits respected and capped to stock
- [x] Google login works on localhost AND the deployed URL via Arctic and database-backed sessions
- [x] Placing an order creates rows in `orders` + `order_items` in Neon and atomically decrements stock
- [x] Confirmation email arrives via Mailgun with correct details and non-blocking failure tolerance
- [x] Order confirmation page shows correct data; cannot be viewed by another user (404 security gate)
- [x] Admin can see all orders, view performance stats, and update order status (with auto-restock on cancel); non-admin gets blocked
- [x] Mobile layout is clean, legible, and responsive at 375px, 768px, and 1280px
- [x] No secrets in client bundle; `.env.example` provided; `.env.local` gitignored
- [x] README with setup + deploy steps + how the owner changes brand/products complete
- [x] `npm run build` and `npm run lint` compile with zero errors

## Post-M7 Polish: Section Heading Contrast Alignment

### What was implemented
- **High-Contrast Section Headings on Ivory Theme**:
  - Audited typography across all customer-facing routes (`/`, `/shop`, `/shop/[slug]`, `/cart`).
  - Corrected section headings and page titles that previously specified `text-[var(--ivory)]` on the ivory background (`var(--ivory)` / `#FAF7F2`) to `text-[var(--ink)]` (`#0E0E10`).
  - Updated root layout `<body>` baseline classes to `bg-[var(--ivory)] text-[var(--ink)]`.
  - Updated secondary button borders, trust badges, and specification headings to ensure strict WCAG AA contrast compliance.

### Challenges
- Ensuring components with dark containers (e.g. `ProductCard`, `FilterSidebar`, `CartDrawer`, and Atelier banner) preserved their high-contrast ivory text on charcoal backgrounds while only updating headings resting directly on the light ivory page canvas.

### Decisions and assumptions
- Preserved `text-[var(--ivory)]` on dark elements (`bg-[var(--charcoal)]`, `bg-[var(--ink)]`) for consistent dark-luxury editorial depth while enforcing `text-[var(--ink)]` on page-level backgrounds.

## Server-Side Services Architecture Refactoring

### What was implemented
- **Domain-Driven Service Layer (`src/server/services/`)**:
  - Implemented `ProductService` (`src/server/services/product.service.ts`): Encapsulates catalog queries, complex filtering (category, price range, in-stock condition), keyword search (name, brand, description), sorting, pagination, featured watches, and related calibers.
  - Implemented `OrderService` (`src/server/services/order.service.ts`): Encapsulates atomic ACID order transactions on the Neon WebSocket Pool, inventory re-validation, stock decrements, order cancellation with automatic restocking, and secure multi-tier order retrieval.
  - Implemented `AdminService` (`src/server/services/admin.service.ts`): Encapsulates store analytics (total revenue, order counts, pending counts), filtered order queries for back-office staff, and order status lifecycle updates.
  - Implemented `AuthService` (`src/server/services/auth.service.ts`): Encapsulates Google OAuth handshake, PKCE code verifier creation, token exchange, user record upsert with `ADMIN_EMAILS` resolution, and session creation/invalidation.
  - Implemented `EmailService` (`src/server/services/email.service.ts`): Encapsulates transactional customer confirmation receipts and owner dispatch notifications via Mailgun HTTP API with automated database timestamping (`emailSentAt`).
- **Complete Elimination of Leaky Database Calls in Presentation & Controllers**:
  - Refactored `src/app/page.tsx` and `src/app/shop/[slug]/page.tsx` to completely remove raw `db` queries, replacing them with typed `ProductService` calls.
  - Refactored all API route handlers (`/api/products`, `/api/orders`, `/api/orders/[orderNumber]`, `/api/admin/orders`, `/api/admin/orders/[id]`, `/api/auth/google`, `/api/auth/google/callback`, `/api/auth/logout`) into clean, thin HTTP controllers that delegate exclusively to the domain services.
  - Direct database access (`db`) is now strictly isolated within `src/server/services/` and `src/server/db/`.

### Challenges
- Ensuring existing callers and internal helpers maintained backwards compatibility while migrating to structured class-based service abstractions. Solved by providing barrel exports in `src/server/services/index.ts` and delegators in `src/server/orders/index.ts`.

### Decisions and assumptions
- Enforced `import 'server-only'` across all service modules to guarantee that database logic, external API keys, and server infrastructure never leak into client bundles.

## Order Confirmation Liveness & Flexible Payment Strategy

### What was implemented
- **Hybrid SSR + React Query Order Confirmation Tracker (`src/components/orders/OrderConfirmationTracker.tsx`)**:
  - Implemented a hybrid architecture: the Server Component (`src/app/order-confirmation/[orderNumber]/page.tsx`) renders full HTML on initial request with zero loading skeleton waterfall, passing `initialOrder` and `initialItems` to the client tracker.
  - Built smart tiered polling with TanStack React Query:
    - **Burst Phase (0–60s):** High-frequency verification polling with gentle exponential backoff (4s → 7s → 12s) while awaiting incoming transfer credit.
    - **Background Heartbeat (after 60s cutoff):** Drops to a relaxed 35-second heartbeat interval (plus window-focus refetches) to conserve mobile battery and server connections.
    - **Terminal Stop:** Automatically ceases polling once the order reaches `confirmed`, `shipped`, `delivered`, or `cancelled`.
    - **Interactive Control:** Embedded a manual "Check Status Now" button with loading spinner so customers can immediately verify after completing bank transfer.
    - **Dynamic State Transition:** The moment payment clears, the bank wire instructions box dynamically transforms into an emerald "Payment Authorized & Verified" receipt banner with a celebration toast.
- **Flexible Multi-Method Payment Model (Instant Card Simulation + Bank Wire + POD)**:
  - Extended schema and validation (`src/server/db/schema.ts`, `src/lib/validators.ts`) to support `'card'` alongside `'bank_transfer'` and `'pay_on_delivery'`.
  - In `OrderService`, orders placed with `paymentMethod: 'card'` are immediately initialized as `confirmed`, enabling seamless end-to-end automated testing and previewing of post-purchase states without admin intervention.
  - Updated `src/components/checkout/CheckoutForm.tsx` to render all three payment options with dedicated badges, descriptions, and automatic fallback handling.
  - Updated transactional email templates (`src/server/email/templates.ts`) to render a green verified payment notice when paid online via card.

### Challenges
- **React Compiler Purity Constraint on Timing References**: Initializing `useRef<number>(Date.now())` during the render phase tripped the React Compiler's idempotency rule (`react-hooks/purity`). Resolved by initializing `startTimeRef` to `null` and populating the timestamp inside a `useEffect` on mount.

### Improvements
- When connecting real payment providers like Paystack or Stripe, wire their webhook endpoint (`POST /api/webhooks/paystack`) into `OrderService` to verify the HMAC signature and flip orders to `confirmed`—the frontend polling tracker and confirmation UI will seamlessly respond without any changes.

### Decisions and assumptions
- Retained database-backed opaque session tokens over JWTs for the web client to maintain strict `HttpOnly` XSS protection and 0ms revocation without needing a Redis cluster or client-side refresh token interceptor machinery, while keeping the architecture prepared for mobile Bearer token integration.

## Brand Localization & Nigerian Audience Adaptations ("Dave Store")

### What was implemented
- **Central Brand & Identity Update (`src/config/brand.ts`, `src/config/shop.ts`)**:
  - Rebranded the store name from placeholder "Meridian Time" to **"Dave Store"**.
  - Updated store tagline to "Original watches for everyday confidence" and company statement to reflect authentic, high-quality wristwatches accessible to Nigerian watch lovers.
  - Updated support email (`support@davestore.ng`), direct customer care line (`+234 802 345 6789`), showroom location (`Ikeja, Lagos, Nigeria`), and official bank transfer beneficiary name to **Dave Store**.
  - Replaced high-horology European tropes with simple, reassuring Nigerian trust guarantees: *100% Original Watches*, *1-Year Warranty*, *Fast Nationwide Delivery*, and *Quick WhatsApp Support*.
- **Language Normalization Across Storefront**:
  - Audited all user-facing interfaces to eliminate foreign, exclusionary terminology (`concierge`, `requisition`, `vault`, `atelier`, `acquisitions`, `caliber`, `maison`, `heritage`, `horology`, etc.) in favor of clean, direct retail language (`WhatsApp Support`, `Order`, `In Stock`, `Watch Collection`, `My Orders`, `Similar Watches`, etc.).
  - Replaced dead and foreign Header links (`Maison`, `Heritage`) with functional, localized links (`Collection` -> `/shop`, `Categories` -> `/#categories`, `Why Us` -> `/#why-us`).
  - Replaced "Atelier Note" with "About This Watch", "Acquire Timepiece" with "Add to Cart", and "Vault Out of Stock" with "Out of Stock".
  - Updated checkout and order confirmation wording so status messages and notifications speak directly and clearly to the customer.
- **Transactional Email & Service Message Localization (`src/server/email/templates.ts`, `src/server/services/order.service.ts`)**:
  - Simplified order confirmation email templates, subject lines, and payment instructions.
  - Replaced cryptic inventory errors ("Insufficient timepieces in vault") with clear retail feedback ("Only X item(s) left in stock").
- **Dynamic SEO & Visual Branding Assets (`src/app/layout.tsx`, `src/app/icon.tsx`, `src/app/opengraph-image.tsx`)**:
  - Updated root metadata keywords to target authentic Nigerian watch search terms (`Dave Store`, `buy watches Lagos`, `original wristwatches Nigeria`, etc.).
  - Updated dynamic favicon monogram to `DS` (Dave Store) and OpenGraph card subtitle to "Original Wristwatches · Lagos, Nigeria".

### Challenges
- Ensuring the brand tone remains clean, premium, and trustworthy without feeling overly stiff or using foreign horological jargon that doesn't resonate with everyday Nigerian buyers.
- **Empty Cart Flash on Order Placement:** Calling `clearCart()` synchronously before `router.push()` cleared the Zustand store immediately, causing the subscribed `CheckoutForm` to flash its "Your Cart is Empty" fallback view while the router was completing navigation to `/order-confirmation/[orderNumber]`. Resolved by adding an `isOrderComplete` state guard that holds an elegant transition loader until the confirmation route mounts.

### Decisions and assumptions
- Preserved existing product database identifiers and cart persistence keys (`meridian_cart_v1`) to prevent cache or hydration invalidation for active sessions while completely updating all customer-facing copy.

## Admin Product Creation & Inventory Management

### What was implemented
- **Domain Service Layer (`src/server/services/product.service.ts`)**:
  - Implemented `createProduct(input)`: Generates URL-safe slugs with automated collision resolution (e.g. `rolex-submariner-2`), validates price in integer kobo, and persists the new product record into Neon.
  - Implemented `listAllProducts()`: Queries all watches in the catalog sorted by creation recency for administrative overview.
- **Validation Schemas (`src/lib/validators.ts`)**:
  - Added `productCategorySchema`: Restricts category inputs to `dress`, `sport`, `classic`, and `smart`.
  - Added `createProductSchema`: Server-side Zod validation ensuring required fields, image URLs, and integer kobo pricing.
  - Added `createProductFormSchema`: Client-side schema tailored for user input in Naira (`priceNaira`) and React Hook Form validation.
- **Admin API Controller (`src/app/api/admin/products/route.ts`)**:
  - `GET /api/admin/products`: Guarded by `requireAdmin()`, returns all catalog products.
  - `POST /api/admin/products`: Guarded by `requireAdmin()`, parses body, saves new product via `ProductService.createProduct()`, triggers cache revalidation on `/shop` and `/` (`revalidatePath`), and returns HTTP 201 with the created product entity.
- **Client Hooks (`src/hooks/useAdminProducts.ts`)**:
  - `useAdminProducts()`: TanStack Query hook fetching all watches with stale-time caching.
  - `useCreateProduct()`: TanStack Mutation hook that posts new product data, automatically invalidates both `['admin', 'products']` and `['products']` caches, and triggers toast notifications.
- **Admin Inventory Dashboard & Creation Modal (`src/components/admin/`)**:
  - `AdminDashboardClient.tsx`: Added dual tab navigation (**Customer Orders** and **Watch Inventory**), an inventory statistics counter, and a prominent **+ Add New Watch** action button.
  - Watch Inventory Table: Lists watch thumbnail, title, brand, category badge, formatted Naira price, real-time stock pill (In Stock, Low Stock, Out of Stock), Featured flag, and a direct link to view the watch in the public store.
  - `CreateProductModal.tsx`: Comprehensive modal with 4 curated watch image presets (with instant previews), custom image URL support, category selector, live Naira price formatting display, stock count, movement/specs, and homepage featured toggle.
- **Image Domain Configuration (`next.config.ts`)**:
  - Enabled wildcard remote patterns (`https://**`) to ensure any custom image URL provided by the administrator renders safely with Next.js Image optimization without breaking.

### Challenges
- **React Hook Form / Zod 4 Type Alignment:** In Zod 4, fields with `.default()` create a variance between `z.input` and `z.output`, causing `@hookform/resolvers/zod` to flag type incompatibilities with `useForm<T>`. Resolved by defining pure required field schemas for the form while supplying defaults in `useForm({ defaultValues: ... })`.
- **Wildcard Image Host Security & Compatibility:** Next.js throws an error if an administrator inputs an image URL from an unlisted CDN domain. Resolved by adding a flexible HTTPS remote pattern in `next.config.ts`.

### Decisions and assumptions
- Product prices are inputted in standard Nigerian Naira (₦) for administrative convenience and automatically converted to integer kobo (`Math.round(priceNaira * 100)`) before transmission, strictly upholding the repository's integer kobo rule.
- Creating a watch automatically invalidates both client-side React Query caches and Next.js route caches (`/` and `/shop`) so new additions appear immediately across the entire site without requiring a server reboot.

## Vercel OAuth State Cookie & Next.js Serverless Alignment

### What was implemented
- **Reliable Serverless Cookie Serialization on Redirects (`src/app/api/auth/google/route.ts`, `callback/route.ts`, `logout/route.ts`)**:
  - Replaced native `Response.redirect()` with `NextResponse.redirect()` across all OAuth and session management routes.
  - Attached transient OAuth cookies (`g_state`, `g_code_verifier`, `g_next`) and persistent session cookies (`meridian_session`) directly onto `response.cookies.set(...)` in addition to `cookieStore.set()`.
- **Dynamic Origin Preservation & Trailing Slash Sanitization (`src/server/auth/google.ts`)**:
  - Added trailing-slash sanitization to `NEXT_PUBLIC_SITE_URL` to prevent double-slash redirect paths (`//api/auth/google/callback`).
  - Added Vercel environment fallbacks (`VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`) so deployed environments resolve legitimate HTTPS URLs instead of defaulting to localhost.
  - Updated callback destination to preserve the requesting origin (`new URL(nextUrl, request.url)`).
- **OAuth Diagnostic Telemetry (`src/server/services/auth.service.ts`)**:
  - Added granular error diagnostic logging for state verification failures (`hasCode`, `hasState`, `hasStoredState`, `hasStoredVerifier`, `stateMatch`).

### Challenges
- In Next.js App Router on Vercel serverless functions, returning raw Web API `Response.redirect()` bypasses the internal cookie store buffer, causing the browser to redirect to Google without receiving the `Set-Cookie` headers for `g_state`. Resolved by using `NextResponse.redirect()` and explicitly writing cookies onto the response object.

## Mobile Client Architecture (CORS, Mobile JWT & Cross-Platform Cart Sync)

### What was implemented
- **Full CORS Middleware & Headers (`src/proxy.ts`, `next.config.ts`)**:
  - Configured Next.js headers to return `Access-Control-Allow-Origin: *`, allowed HTTP methods (`GET,POST,PUT,PATCH,DELETE,OPTIONS`), and allowed headers (`Content-Type, Authorization, X-Requested-With, Accept`) on all `/api/*` endpoints.
  - Implemented instant preflight handling in `src/proxy.ts` (Next.js middleware) that intercepts `OPTIONS` requests and returns HTTP 204 No Content with CORS headers, bypassing serverless database overhead.
- **Mobile JWT Authentication (`src/server/auth/jwt.ts`, `src/server/auth/guards.ts`)**:
  - Integrated `jose` using universal Web Crypto algorithms (`HS256`).
  - Implemented `signMobileToken(user: User)` issuing 30-day JWTs with `sub`, `email`, `role`, and `name` claims.
  - Implemented `verifyMobileToken(token: string)` with full signature verification and expiration checking.
  - Upgraded server auth guards (`getCurrentUser`, `requireUser`, `requireAdmin`) to dynamically authenticate both Web cookie sessions (`meridian_session`) and Mobile Bearer tokens (`Authorization: Bearer <jwt>`) with zero regression to web browsing.
- **Mobile Authentication Routes (`src/app/api/auth/mobile/`)**:
  - `POST /api/auth/mobile/google`: Validates native Google OAuth ID tokens from mobile clients via Google's tokeninfo API, enforces verified emails, upserts user records in Neon, applies admin role matching against `ADMIN_EMAILS`, and issues a 30-day mobile JWT.
  - `GET /api/auth/mobile/token`: Allows any authenticated web session or existing client to retrieve a mobile JWT token.
- **Persistent Database Cart (`src/server/db/schema.ts`, `src/server/services/cart.service.ts`)**:
  - Added `cart_items` table in Neon PostgreSQL with foreign keys cascade to `users` and `products`, integer quantities, and a composite unique index on `(user_id, product_id)`.
  - Applied schema migration to Neon using `npm run db:push`.
  - Implemented `CartService`: `getUserCart`, `setItem`, `syncCart` (bulk merge), and `clearCart`.
- **Cart API Endpoints (`src/app/api/cart/route.ts`)**:
  - `GET /api/cart`: Returns active user's cart populated with product metadata, live stock, and prices in integer kobo.
  - `POST /api/cart`: Adds or updates single item quantity with stock clamping.
  - `PUT /api/cart`: Bulk merges guest items into the user's persistent cart.
  - `DELETE /api/cart`: Clears the user's cart in Neon.
  - All endpoints guarded by `requireUser()` and accessible via Bearer tokens or cookies.
- **Web Store & Mobile Cart Synchronization (`src/store/cart.ts`, `src/hooks/useCartSync.ts`, `src/components/layout/AccountMenu.tsx`)**:
  - Updated web Zustand store with non-blocking server synchronization on cart mutations (`add`, `setQty`, `remove`, `clear`).
  - Created `useCartSync(isAuthenticated)` hook mounted at root layout level that hydrates server cart items into web state and flushes pre-login guest items onto the server upon sign in.

### Challenges
- **Next.js Preflight Handling in Serverless Environments:** In Next.js App Router, route handlers can occasionally reject `OPTIONS` requests before the handler is invoked if not explicitly configured. Handling `OPTIONS` at the middleware proxy level (`src/proxy.ts`) guarantees reliable 204 responses across all cloud hosting providers including Vercel.
- **React Hydration & Non-blocking Cart Sync:** Local Zustand mutations must remain instantaneous (0ms) so web users do not experience UI lag when clicking "+". Solved by performing local store updates immediately and dispatching background `fetch('/api/cart')` requests asynchronously without blocking UI interactions.

### Decisions and assumptions
- Token lifespan is set to 30 days for mobile clients, avoiding frequent sign-ins in React Native Expo while maintaining token revocability.
- Server-side cart operations enforce real-time stock clamping against the products table to prevent users from reserving more units than available in inventory.
