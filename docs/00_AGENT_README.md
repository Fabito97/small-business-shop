# Watch Shop: Agent Instructions (READ FIRST)

You are building a polished, branded e-commerce site for a **watch business** (HNG15 Lesson 2 task, individual project). It will later be handed to the shop owner, so keep the code clean, configurable and easy to hand over.

## Required by the task (non-negotiable)
1. A shop website with a **checkout page**
2. **All data persisted** in a **Neon** Postgres database (via **Drizzle ORM**)
3. **Confirmation emails** sent via **Mailgun**
4. **Google sign-in**, using a Google Cloud Console OAuth client. Auth is **implemented in our own code** (no Supabase Auth / Clerk / NextAuth / Better Auth). Google OAuth only, no passwords.

## Our scope (keep it simple, no extras)
Landing page, marketplace (product listing), product detail page, cart (drawer + page), checkout, order confirmation page, my orders (small), and a tiny admin orders dashboard.

**Out of scope:** real payments, discount codes, reviews, wishlists, multi-currency, product CRUD UI, i18n, password auth, tests beyond a smoke check. Do NOT add them. If tempted, leave a `// FUTURE:` comment.

## Tech stack (fixed)
| Concern | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript, `src/` dir, Node runtime for all API routes |
| Styling | Tailwind CSS + `lucide-react`. shadcn/ui allowed (Button, Input, Sheet, Select, Badge, Table, Skeleton, Sonner) |
| Client cart state | **Zustand** with `persist` middleware |
| Server data fetching | **TanStack React Query** (products list, orders, admin orders) |
| Database | **Neon** Postgres + **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `ws`) using the **WebSocket Pool driver** so transactions work |
| Auth | Own implementation: **Arctic** (Google OAuth helper) + `sessions` table + httpOnly cookie |
| Email | **Mailgun HTTP API** via plain `fetch` |
| Validation | `zod` (+ `react-hook-form`, `@hookform/resolvers`) |
| Hosting | Vercel |

## Document map
- `01_PRD.md`: pages, features, flows, acceptance criteria
- `02_DATABASE.md`: schema, seed, db client, config (lives in `src/server/db/` and project root)
- `03_ARCHITECTURE.md`: folders, auth implementation, order transaction, API contracts, email, env vars
- `04_DESIGN_SYSTEM.md`: brand, colors, typography, components
- `05_SETUP_CHECKLIST.md`: manual steps for the human (Neon, Google, Mailgun, Vercel)
- `06_BUILD_PLAN.md`: ordered milestones + definition of done

## Ground rules
- **Money is integer kobo** (`priceKobo`). Format to Naira only in the UI via `formatNaira()`.
- **Never trust the client for prices or totals.** `createOrder()` re-reads prices from the DB.
- **Order creation is one DB transaction** (stock check + decrement + inserts). Any failure rolls back everything.
- **Secrets stay server-side.** Import `server-only` in `server/` (e.g. `src/server/db/`, `src/server/auth/`, `src/server/email/`).
- **There is no RLS.** Authorization is enforced in code: every protected route/page calls `requireUser()` / `requireAdmin()`, and every order query is scoped by `userId` (unless admin). Test this explicitly.
- **Brand name, contact details, currency, shipping fee are config** in `src/config/brand.ts` and `src/config/shop.ts`. No hardcoded brand strings in components.
- Every page needs loading, empty and error states. Mobile first.
- Email failure must NOT fail the order. Log it, leave `emailSentAt` null, move on.
- Follow `06_BUILD_PLAN.md` in order. Commit after each milestone. Run `npm run build` before finishing each.
