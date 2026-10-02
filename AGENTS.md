# AGENTS.md

Instructions for the AI coding agent working in this repo. Keep this file at the **repo root**. The full specs live in `/docs`.

## Project
E-commerce site for a **watch business** (HNG15 Lesson 2, individual task; to be handed to the shop owner afterwards). Placeholder brand: **Meridian Time**, configurable.

Required by the task: shop + **checkout page**, data persisted in **Neon** (via **Drizzle**), confirmation emails via **Mailgun**, **Google sign-in** through Google Cloud Console (implemented in our own code).

## Read these first (in order)
1. `docs/00_AGENT_README.md`: scope, stack, ground rules
2. `docs/01_PRD.md`: pages, flows, acceptance criteria
3. `docs/02_DATABASE.md` + `docs/drizzle-files/`: schema, seed, db client
4. `docs/03_ARCHITECTURE.md`: folders, auth, order transaction, API contracts, email
5. `docs/04_DESIGN_SYSTEM.md`: brand, colors, type, components
6. `docs/06_BUILD_PLAN.md`: **the order of work**

`docs/05_SETUP_CHECKLIST.md` is for the human (account setup). Don't try to do those steps; just tell the human what you need.

If docs conflict, precedence is: this file > `03_ARCHITECTURE.md` > `01_PRD.md` > the rest. If something is ambiguous and not covered, pick the simplest option, note it in the README under "Decisions", and continue. Don't stall.

## Stack (fixed, don't substitute)
Next.js 16 (App Router, TypeScript, `src/`), Tailwind, shadcn/ui, lucide-react, **Zustand** (cart, persisted), **TanStack React Query** (client lists), **Drizzle ORM + Neon** (WebSocket `Pool` driver), **Arctic** (Google OAuth) with own DB sessions, **Mailgun HTTP API** via `fetch`, **zod** + react-hook-form, Vercel.

## Hard rules
- **No extra scope.** No payment gateway, coupons, reviews, wishlists, product CRUD UI, password auth, i18n. Leave `// FUTURE:` instead.
- **No other auth libraries** (no NextAuth, Better Auth, Clerk, Supabase Auth).
- **Money = integer kobo.** Only format with `formatNaira()` in the UI. Never use floats for money.
- **Never trust client prices/totals.** `createOrder()` re-reads prices from the DB.
- **Order creation is a single `db.transaction()`.** Use the `neon-serverless` Pool driver, NOT `neon-http` (it can't do transactions). Out-of-stock throws and rolls back.
- **There is no RLS.** Every protected page/API route calls `requireUser()` / `requireAdmin()`. Every order query is scoped to `userId` unless the user is admin. Customer email comes from the session, never the request body.
- **Secrets are server-only.** `import 'server-only'` in `server/` (e.g. `src/server/db/`, `src/server/auth/`, `src/server/email/`, `src/server/orders/`). Never reference secrets in client components. Only `NEXT_PUBLIC_*` vars may reach the browser.
- **Email failure must not fail an order.** Catch, `console.error`, leave `emailSentAt` null.
- **No hardcoded brand text.** Name, tagline, contact, socials, bank details, shipping fee and free-shipping threshold come from `src/config/brand.ts` and `src/config/shop.ts`.
- **Escape user-provided strings** in email HTML.
- Sanitise the `next` redirect param (must start with a single `/`).

## Conventions
- TypeScript strict; no `any` unless justified in a comment. Validate every API input with zod (schemas in `lib/validators.ts`, shared by client form and server).
- Server components by default; add `'use client'` only when needed (cart, filters, forms, drawers).
- API routes: Node runtime, return `{ error: { code, message } }` JSON with correct status codes (400/401/403/404/409/500).
- Data fetching: server components query Drizzle directly (landing, product detail, confirmation). React Query is for interactive lists (`/shop`, `/orders`, `/admin`).
- Cart store: guard counts/badges against hydration mismatch (`mounted` flag).
- Every page has loading (skeleton), empty and error states. Mobile first; verify at 375px.
- Images via `next/image` with `alt`; allow remote hosts in `next.config.ts`.
- Styling uses the design tokens in `docs/04_DESIGN_SYSTEM.md`. No random colors/fonts.
- File names: `kebab-case` for files, `PascalCase` for components. Imports use the `@/` alias.
- Small focused components; no files over ~250 lines without a reason.
- Comments explain *why*, not *what*.

## Commands
```bash
npm run dev          # local dev
npm run build        # must pass before every commit
npm run lint
npm run db:push      # drizzle-kit push (sync schema to Neon)
npm run db:seed      # tsx --env-file=.env.local src/server/db/seed.ts
npx drizzle-kit studio
```
Add these scripts to `package.json` during M0.

## Environment
Copy `.env.example` to `.env.local`. Required keys: `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL` (Neon **pooled**), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`, `MAILGUN_BASE_URL`, optional `OWNER_NOTIFY_EMAIL`.
Never commit `.env.local`. Never print secrets in logs. If a key is missing, stop and ask the human for it rather than inventing values.

## Workflow
1. Work through `docs/06_BUILD_PLAN.md` milestone by milestone (M0 → M7).
2. After each milestone: run `npm run build` and `npm run lint`, fix errors, then commit with a clear message (`feat: cart drawer and persisted store`).
3. Verify the milestone's "Done when" line by actually exercising it (run the app, hit the route), not just by reading code.
4. Keep a running `README.md` (setup, env vars, features, how the owner edits products/brand, how to make an admin, known limitations).
5. When blocked on something only the human can do (create Google OAuth client, Mailgun verification, Neon project, Vercel env vars), say exactly what you need and which doc section covers it, then continue with whatever isn't blocked.
6. Maintain a `REVIEW.md` file at the repo root. After each milestone, append a new section with:
   - **What was implemented:** a short summary of the work
   - **Challenges:** the main problems you hit and how you solved them
   - **Improvements:** what you would do next, or anything left unfinished
   - **Decisions and assumptions:** anything you chose that the docs didn't specify

## Definition of done
All acceptance criteria in `docs/01_PRD.md` are ticked, plus:
- [ ] `npm run build` and `npm run lint` pass with zero errors
- [ ] Manual checks pass: user A cannot read user B's order; non-admin gets 403/404 on admin pages and APIs; tampered OAuth `state` is rejected; forced out-of-stock leaves no partial order and no stock change
- [ ] Order placed → rows in `orders` + `order_items`, stock decremented, confirmation email received
- [ ] Looks polished at 375 / 768 / 1280 px
- [ ] README complete; `.env.example` complete; no secrets in the repo
- [ ] Deployed to Vercel and the full flow works in production

## Don'ts (quick list)
Don't rewrite the stack. Don't add features. Don't skip transactions. Don't expose secrets to the client. Don't leave `console.log` debugging or dead code. Don't mark a milestone done without testing it.
