# Build Plan (agent: follow in order, commit after each)

## M0: Scaffold
- `create-next-app` (TS, Tailwind, App Router, src dir). Install: `drizzle-orm @neondatabase/serverless ws arctic zustand @tanstack/react-query zod react-hook-form @hookform/resolvers lucide-react sonner server-only` and dev: `drizzle-kit tsx @types/ws`. Init shadcn.
- Add `config/brand.ts`, `config/shop.ts`, `lib/money.ts`, fonts, color tokens, `.env.example`, db scripts.
- Schema, seed, and db client in `src/server/db/` + root config.
- **Done when:** app runs; tokens/fonts applied; `drizzle-kit push` + `db:seed` fill Neon.

## M1: Auth
- `server/auth/*`, the three `/api/auth` routes, `middleware.ts`, `/login`, Header AccountMenu.
- **Done when:** Google sign-in works locally; user + session rows appear; logout deletes the session; `ADMIN_EMAILS` yields `role='admin'`; tampered `state` is rejected.

## M2: Catalogue
- Header/Footer, `GET /api/products`, `useProducts`, `/shop` filters + skeletons, ProductCard, `/shop/[slug]`.
- **Done when:** seeded watches browse/filter/sort and open detail pages.

## M3: Cart
- `store/cart.ts`, AddToCart, CartDrawer, `/cart`, header badge (hydration-safe).
- **Done when:** persists across refresh, caps at stock, shipping rule applied.

## M4: Checkout + orders + email
- Checkout form, `createOrder()` + `POST /api/orders`, Mailgun lib + templates in `server/email/`, confirmation page, `/orders`.
- **Done when:** order + items in Neon, stock decremented, email received, a forced out-of-stock rolls back cleanly, another user gets 404 on someone else's order.

## M5: Admin
- `/admin` stats + table + status filter, order detail + status update (cancel restocks).
- **Done when:** admin works; non-admin blocked on both page and API.

## M6: Landing + polish
- Landing sections, metadata/OG, favicon, empty/error states, responsive pass (375/768/1280), a11y pass.

## M7: Ship
- README, deploy to Vercel, run the production test in `05_SETUP_CHECKLIST.md` §E.

## Final self-review
Re-read the acceptance criteria in `01_PRD.md` and tick each. List gaps in the README under "Known limitations".
