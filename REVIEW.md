# Milestone Reviews

## Milestone 0: Scaffold

### What was implemented
- Initialized Next.js 15 App Router project with TypeScript, Tailwind CSS, and `src/` directory layout.
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
- Set up Drizzle database schema, client, and seed script in `src/db/`:
  - `src/db/schema.ts` (users, sessions, products, orders, order_items with DB CHECK constraints and indexes)
  - `src/db/index.ts` (WebSocket Pool driver with `import 'server-only'`)
  - `src/db/seed.ts` (standalone runner with conflict-handling inserts)
  - `drizzle.config.ts` configured for PostgreSQL dialect pointing to `src/db/schema.ts`
- Added project npm scripts in `package.json` (`dev`, `build`, `lint`, `db:push`, `db:seed`).
- Created `.env.example` documenting all required secrets and configuration keys.
- Configured `next.config.ts` with `images.remotePatterns` for `images.unsplash.com`.
- Added test bench on landing page (`src/app/page.tsx`) verifying token application, font variables, and currency formatting.
- Verified that `npm run build` and `npm run lint` compile cleanly with zero errors.

### Challenges
- **Project-scoped script restrictions (`allow-scripts`)**: The host environment npm configuration had `allow-scripts = ["electron"]`, which caused standard `npm install` and CLI scaffolders (such as `create-next-app` and `shadcn init`) to exit with `EALLOWSCRIPTS`. Resolved by running package installations with `--ignore-scripts` and manually configuring the required shadcn configuration (`components.json` and `src/lib/utils.ts`).
- **`server-only` conflict with tsx script**: Standalone Node scripts executed by `tsx` (like `db:seed`) cannot resolve Next.js's `'server-only'` package. Resolved by keeping `import 'server-only'` in `src/db/index.ts` for strict Next.js API/server component protection, while setting up `src/db/seed.ts` with a direct connection pool.

### Improvements
- In M1, implement the Arctic Google OAuth handler with PKCE and state verification, database session store, and authentication guards.
- Connect to a live Neon database when the `DATABASE_URL` connection string is provided by the user and execute `npm run db:push` and `npm run db:seed`.

### Decisions and assumptions
- Used Tailwind CSS v4 `@theme` directive to map `--color-*` and `--font-*` tokens directly to CSS variables, ensuring full compatibility with Next.js 15 while honoring the exact color hex codes and font pairings from `04_DESIGN_SYSTEM.md`.
- Stored all initial watch catalogue seed data in `src/db/seed.ts` using 8 watches spanning dress, sport, classic, and smart categories with realistic kobo amounts.
