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

