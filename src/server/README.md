# Backend Services Architecture (`src/server/`)

This directory houses all server-side business logic, database interactions, external service integrations, and transactional operations for Meridian Time.

## Directory Structure

```
src/server/
├── services/        # Encapsulated Business & Domain Services
│   ├── product.service.ts # Product queries, catalog filtering, search, and details
│   ├── order.service.ts   # ACID order creation, inventory decrement, cancel & restock
│   ├── admin.service.ts   # Analytics metrics, admin orders list, status transitions
│   ├── auth.service.ts    # Google OAuth handshake, token exchange, user upsert, sessions
│   ├── email.service.ts   # Mailgun dispatch, customer receipts, owner alerts, timestamping
│   └── index.ts           # Central barrel export for all domain services
├── db/              # Neon PostgreSQL + Drizzle ORM client, schemas, and seeds
│   ├── index.ts     # Pooled WebSocket connection client (server-only)
│   ├── schema.ts    # Drizzle schema (users, sessions, products, orders, order_items)
│   └── seed.ts      # Standalone seed script
├── auth/            # Authentication Core & Guards
│   ├── google.ts    # Arctic Google OAuth client configuration
│   ├── session.ts   # SHA-256 hashed DB sessions and cookie management
│   └── guards.ts    # requireUser(), requireAdmin(), getCurrentUser()
├── orders/          # Backward-compatible Order Delegators
│   └── index.ts     # Re-exports and delegators to OrderService and AdminService
├── email/           # Low-level Email Dispatch & Templates
│   ├── mailgun.ts   # Mailgun HTTP API client
│   └── templates.ts # Order confirmation & admin notification templates
└── index.ts         # Central backend services export
```

## Architectural Guidelines: Abstraction & Encapsulation
- **Service Layer Boundary:** Presentation components (Server Components, pages) and HTTP controllers (Route Handlers) **must never directly query or mutate the database**. All data access, business calculations, and third-party API orchestrations are encapsulated within dedicated Service classes under `src/server/services/`.
- **Database Concealment:** Direct `db` connection instances are restricted to `src/server/` and consumed exclusively by the Service layer.
- **Server Only:** All files inside `src/server/` include `import 'server-only'` to guarantee that zero server secrets or internal implementations leak into client bundles.
- **Transactions:** Complex operations (such as order checkout and order cancellation) execute within single ACID transactions via `db.transaction()` using the Neon WebSocket Pool driver.
