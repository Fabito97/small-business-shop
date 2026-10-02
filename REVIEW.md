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

### Improvements
- In M4 (Checkout & Orders), build the single-transaction order placement (`db.transaction()`), address form with Nigerian state validation, dynamic Pay on Delivery check, Mailgun confirmation email, and order confirmation receipt.

### Decisions and assumptions
- Added a visual drawer slide-in upon adding items from both the catalogue card and the detail view to provide immediate confirmation without intrusive modal dialogs.
- Enforced hard stock limits directly in the Zustand store as well as the UI buttons to prevent users from placing unavailable inventory in the cart.
