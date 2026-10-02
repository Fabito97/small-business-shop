# Backend Services Architecture (`src/server/`)

This directory houses all server-side logic, database interactions, external service integrations, and business transactions for Meridian Time.

## Directory Structure

```
src/server/
├── db/              # Neon PostgreSQL + Drizzle ORM client, schemas, and seeds
│   ├── index.ts     # Pooled WebSocket connection client (server-only)
│   ├── schema.ts    # Drizzle schema (users, sessions, products, orders, order_items)
│   └── seed.ts      # Standalone seed script
├── auth/            # Authentication & Session Management
│   ├── google.ts    # Arctic Google OAuth client
│   ├── session.ts   # SHA-256 hashed DB sessions and cookie management
│   └── guards.ts    # requireUser(), requireAdmin(), getCurrentUser()
├── orders/          # Transactional Order Operations
│   └── index.ts     # createOrder() transaction, cancelOrder(), stock decrement
├── email/           # Email Dispatch
│   ├── mailgun.ts   # Mailgun HTTP API client
│   └── templates.ts # Order confirmation & admin notification templates
└── products/        # Catalogue Query Services
    └── index.ts     # Filtered product retrieval & stock checks
```

## Security & Isolation Rules
- **Server Only:** All files inside `src/server/` must never leak into client bundles. Secrets (`DATABASE_URL`, `MAILGUN_API_KEY`, `GOOGLE_CLIENT_SECRET`, etc.) are consumed exclusively here.
- **Transactions:** Multi-table mutations and stock updates must use `db.transaction()` via the WebSocket Pool driver.
- **Access Control:** All data queries must be filtered by the authenticated user's ID unless the session is verified as `admin`.
