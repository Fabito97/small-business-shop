# Database Design (Neon Postgres + Drizzle)

Files in `drizzle-files/`: copy `schema.ts`, `seed.ts`, `index.ts` into `src/db/` and `drizzle.config.ts` to the project root.

## Entity overview
```
users ──1:N── sessions
  └──1:N── orders ──1:N── order_items ──N:1── products
```

## Tables
- **users**: `id`, `googleId` (unique), `email` (unique), `name`, `avatarUrl`, `role` (`customer|admin`), `createdAt`
- **sessions**: `id` (SHA-256 hash of the cookie token), `userId`, `expiresAt`
- **products**: `slug` (unique, used in URLs), `name`, `brand`, `description`, `priceKobo`, `category` (`dress|sport|classic|smart`), `movement`, `caseSizeMm`, `strap`, `waterResistance`, `imageUrl`, `gallery[]`, `stock`, `featured`, `isActive`
- **orders**: `orderNumber` (e.g. `MT-7K2Q9X`, generated in code, unique), `userId`, `status`, `paymentMethod`, `subtotalKobo`, `shippingKobo`, `totalKobo`, customer + shipping fields, `notes`, `emailSentAt`
- **order_items**: snapshots of `productName`, `imageUrl`, `unitPriceKobo` + `quantity` so old orders stay correct if a product changes

## Design decisions
1. **Kobo integers** (`₦450,000` → `45_000_000`). `bigint` in `mode: 'number'` is safe far beyond our range.
2. **Transactions need the WebSocket driver.** `drizzle-orm/neon-serverless` + `Pool` (see `index.ts`). The `neon-http` driver does not support `db.transaction()`. Use the **pooled** connection string from Neon.
3. **Stock safety:** decrement with a conditional update (`WHERE stock >= qty`) inside the transaction; zero rows updated = out of stock → throw → rollback. No explicit row locks needed.
4. **DB CHECK constraints** keep stock/price non-negative and quantity positive.
5. **No RLS.** All access goes through server code (see ground rules).
6. **`emailSentAt`** shows which orders have not had a confirmation email.

## Workflow
```
npx drizzle-kit push     # create/update tables in Neon (fine for this project)
npm run db:seed          # tsx --env-file=.env.local src/db/seed.ts
npx drizzle-kit studio   # optional visual browser
```
Add scripts to `package.json`: `"db:push": "drizzle-kit push"`, `"db:seed": "tsx --env-file=.env.local src/db/seed.ts"`. `drizzle.config.ts` must also see `DATABASE_URL` (use `dotenv` with `.env.local` or run with `--env-file`). The seed script cannot import `server-only`, so remove that import line from `index.ts` or keep a separate `seed-db.ts` client.

## Product images
Hosted URLs (Unsplash placeholders in seed). Later the owner can use any image host (Cloudinary, Vercel Blob, etc.). Add the host to `next.config.ts` `images.remotePatterns`.

## Editing products (no admin UI in v1)
Use **Drizzle Studio** or the **Neon SQL Editor / Tables view**; or re-run an edited `seed.ts`. Document this in the README.
