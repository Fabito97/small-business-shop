# Dave Store — Quality Watch E-Commerce

A polished, high-performance storefront and checkout platform designed for an original watch retail business in Nigeria.

- **Brand:** Dave Store ("Original watches for everyday confidence")
- **Currency:** Nigerian Naira (NGN ₦), backed strictly by integer kobo calculations.
- **Task:** HNG15 Lesson 2 individual project (ready to hand off to the store owner).

---

## Tech Stack & Architecture

- **Framework:** Next.js 16 (App Router, TypeScript, `src/` directory layout)
- **Styling:** Tailwind CSS + Google Fonts (Cormorant Garamond & Inter)
- **Icons & UI:** Lucide React, Sonner toasts, custom luxury design tokens
- **State Management:** Zustand with localStorage persistence for cart state
- **Server Data Fetching:** TanStack React Query (catalogue filters, customer orders, admin console)
- **Database & ORM:** Neon Serverless PostgreSQL + Drizzle ORM (WebSocket `Pool` connection for ACID transactions)
- **Authentication:** Custom Google OAuth implementation using Arctic + PostgreSQL database sessions + httpOnly Lax cookies (no third-party auth vendors)
- **Email:** Mailgun HTTP API (`fetch`) for order confirmations with fallback logging
- **Validation:** Zod schemas shared across client forms and server API routes

---

## Key Features

1. **Editorial Luxury Storefront (`/`)**:
   - Hero section with bespoke engraved tourbillon imagery and brand narrative.
   - Curated category previews (Dress, Sport, Classic, Smart).
   - Featured timepieces showcase querying live Neon inventory with stock alerts.
   - Horology Atelier craftsmanship narrative and direct WhatsApp concierge access.
2. **Interactive Marketplace & Detail Views (`/shop`, `/shop/[slug]`)**:
   - Real-time search, price range filtering, category pills, and sorting by price or recency.
   - Dynamic horological specification matrix (caliber, case diameter, water resistance).
   - Instant "Add to Bag" quick action and thumbnail gallery switcher.
3. **Persisted Cart & Slide-Over Drawer (`/cart`)**:
   - Slide-over drawer with free shipping progress bar (orders over ₦1,000,000 receive complimentary courier dispatch).
   - Strict inventory clamping: prevents placing more units in bag than live product stock.
   - Dedicated full `/cart` page with desktop table and mobile card layouts.
4. **Secure Checkout & Order Placement (`/checkout`)**:
   - Prefilled contact details from verified Google session; customer email is locked to user account.
   - Dynamic Pay on Delivery rule: enabled only for supported delivery states (configured in `src/config/shop.ts`, defaults to Lagos); smoothly switches to Direct Bank Transfer for other states with clear feedback.
   - Single ACID database transaction (`createOrder`): re-prices from DB, atomically checks and decrements inventory, rolls back completely on out-of-stock.
   - Non-blocking Mailgun confirmation email dispatch.
5. **Customer Order Receipt & Hub (`/order-confirmation/[orderNumber]`, `/orders`)**:
   - Full order confirmation receipt showing items, financial breakdown, destination, and bank transfer instructions with account details.
   - Multi-tenant security: unauthorized users receive 404 when attempting to access another user's order.
   - Responsive client order history dashboard.
6. **Administrative Operations Console (`/admin`)**:
   - Protected by server-side role check: non-admin users receive a 404 to avoid disclosing internal administrative routes.
   - Real-time stat cards: Total Revenue (excluding cancelled orders), Total Orders, and Pending Orders.
   - Searchable and filterable orders table with interactive status selector (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`).
   - Cancelling an order automatically restocks items back into active inventory in a transaction.
   - Inspection slide-over drawer with detailed order details and public receipt link.

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
- `NEXT_PUBLIC_SITE_URL`: Base URL (e.g. `http://localhost:3000` or production URL without trailing slash)
- `DATABASE_URL`: Neon **pooled** PostgreSQL connection string (WebSocket pool)
- `GOOGLE_CLIENT_ID`: Google Cloud Console OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google Cloud Console OAuth Client Secret
- `ADMIN_EMAILS`: Comma-separated list of admin email addresses (grants `admin` role upon login)
- `MAILGUN_API_KEY`: Mailgun API key
- `MAILGUN_DOMAIN`: Mailgun sending domain
- `MAILGUN_FROM`: Sender header (e.g. `"Dave Store <orders@yourdomain.com>"`)
- `MAILGUN_BASE_URL`: `https://api.mailgun.net` (US) or `https://api.eu.mailgun.net` (EU)
- `OWNER_NOTIFY_EMAIL`: (Optional) Email address to receive notifications when new orders are placed

### 3. Database Migration & Seeding
Once `DATABASE_URL` is set in `.env.local`:
```bash
# Push schema to Neon
npm run db:push

# Seed watch catalogue with initial 8 timepieces
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

## Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project into **Vercel**.
3. Under **Project Settings → Environment Variables**, add all keys from `.env.example`:
   - Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://meridian-time.vercel.app` without a trailing slash).
4. Update your **Google Cloud Console Credentials**:
   - Under **Authorized JavaScript origins**: add `https://your-app.vercel.app`.
   - Under **Authorized redirect URIs**: add `https://your-app.vercel.app/api/auth/google/callback`.
5. Deploy. Neon and Mailgun will connect automatically via the configured environment variables.

---

## How the Shop Owner Manages the Store

### Editing Brand Information & Pricing Rules
All brand copy, contact details, social links, and banking details are centrally located in two clean TypeScript configuration files:
- `src/config/brand.ts`: Brand name, tagline, about story, WhatsApp contact number, phone, physical location, trust badges.
- `src/config/shop.ts`: 
  - Standard courier delivery fee (`shippingFeeKobo`, default ₦5,000).
  - Complimentary delivery threshold (`freeShippingThresholdKobo`, default ₦1,000,000).
  - Corporate bank details for wire transfers (Bank name, Account name, Account number, payment instructions).
  - `PAY_ON_DELIVERY_SUPPORTED_STATES`: Array of Nigerian states eligible for Pay on Delivery (defaults to `['Lagos']`). Easily add more states without touching database schemas or logic.

### Adding and Managing Watches
Administrators can create and inspect products directly from the web application:
1. **Admin Console (`/admin`):** Navigate to the **Watch Inventory** tab and click **+ Add New Watch**.
   - Input watch name, brand, category (`Classic`, `Dress`, `Sport`, `Smart`), price in Naira (₦), stock count, watch specifications (movement, case size, strap, water resistance), and image URL.
   - Includes 4 one-click luxury watch image presets with live previews.
   - Price in Naira is automatically converted into integer kobo and persisted into Neon.
   - Newly added products automatically revalidate public storefront caches and appear immediately on `/shop` and `/`.
2. **Drizzle Studio:** Run `npx drizzle-kit studio` in your terminal for direct visual database row inspection.
3. **Neon Console:** Use the Neon SQL Editor or Tables UI at [neon.tech](https://neon.tech).
4. **Seed File:** Modify `src/server/db/seed.ts` and re-run `npm run db:seed` if reseeding the initial catalogue.

### Making an Administrator
Add any user's Google account email address to the `ADMIN_EMAILS` environment variable in `.env.local` or Vercel. Upon their next Google login, their user role will automatically be assigned as `admin`, granting access to `/admin` and operational order controls.

---

## Milestone Progress & Reviews
Detailed milestone progress notes, challenges, improvements, and architectural decisions are tracked in [REVIEW.md](file:///c:/Users/hp/Documents/hng/watch-shop/REVIEW.md).
