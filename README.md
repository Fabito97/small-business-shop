# Meridian Time — Luxury Watch E-Commerce

A polished, high-performance storefront and checkout platform designed for a luxury watch business in Nigeria.

- **Brand:** Meridian Time ("Wear the hour.")
- **Currency:** Nigerian Naira (NGN ₦), backed strictly by integer kobo calculations.
- **Task:** HNG15 Lesson 2 individual project.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, `src/` directory layout)
- **Styling:** Tailwind CSS + Google Fonts (Cormorant Garamond & Inter)
- **Icons & UI:** Lucide React, Sonner toasts, shadcn/ui components
- **State Management:** Zustand with localStorage persistence for cart state
- **Server Data Fetching:** TanStack React Query (products, customer orders, admin dashboard)
- **Database & ORM:** Neon Serverless PostgreSQL + Drizzle ORM (WebSocket `Pool` connection for transactional integrity)
- **Authentication:** Custom Google OAuth implementation using Arctic + PostgreSQL database sessions + httpOnly Lax cookies (no third-party auth vendors)
- **Email:** Mailgun HTTP API (`fetch`) for order confirmations with fallback logging
- **Validation:** Zod schemas shared across client forms and server routes

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 24)
- npm 9+

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in the required values:
- `NEXT_PUBLIC_SITE_URL`: Base URL (default `http://localhost:3000`)
- `DATABASE_URL`: Neon **pooled** PostgreSQL connection string
- `GOOGLE_CLIENT_ID`: Google Cloud Console OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google Cloud Console OAuth Client Secret
- `ADMIN_EMAILS`: Comma-separated list of admin email addresses
- `MAILGUN_API_KEY`: Mailgun API key
- `MAILGUN_DOMAIN`: Mailgun sending domain
- `MAILGUN_FROM`: Sender email header (e.g. `Meridian Time <postmaster@...>`
- `MAILGUN_BASE_URL`: `https://api.mailgun.net` (US) or `https://api.eu.mailgun.net` (EU)
- `OWNER_NOTIFY_EMAIL`: (Optional) Email to receive new order alerts

### 3. Database Migration & Seeding
Once `DATABASE_URL` is set in `.env.local`:
```bash
# Push schema to Neon
npm run db:push

# Seed watch catalogue
npm run db:seed
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Running Production Build & Linting
```bash
npm run build
npm run lint
```

---

## How the Shop Owner Manages the Store

### Editing Brand Information & Pricing Rules
All brand copy, contact details, social links, and banking details are centrally located in:
- `src/config/brand.ts`: Brand name, tagline, about story, WhatsApp contact, phone, location, trust badges.
- `src/config/shop.ts`: Shipping fee, free delivery threshold, corporate bank account details for wire transfers, all Nigerian states, and `PAY_ON_DELIVERY_SUPPORTED_STATES` (which states are eligible for Pay on Delivery).

### Editing Products & Stock
In version 1.0, product records and inventory can be inspected and updated directly through:
1. **Drizzle Studio:** Run `npx drizzle-kit studio` to launch a visual database management dashboard.
2. **Neon Console:** Use the Neon SQL Editor or Tables UI at [neon.tech](https://neon.tech).
3. **Seed File:** Modify `src/server/db/seed.ts` and re-run `npm run db:seed`.

### Making an Admin
Add any user's Google email address to the `ADMIN_EMAILS` environment variable in `.env.local` or Vercel. Upon their next Google login, their user role will automatically be set to `admin`.

---

## Known Limitations & Planned Enhancements
- Payments currently support Pay on Delivery and Direct Bank Transfer with reference reconciliation (card payment gateway marked as `// FUTURE:`).
- Product management UI is deferred; catalogue managed via Drizzle Studio or direct DB access.
