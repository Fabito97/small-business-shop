// src/db/seed.ts   Run: npm run db:seed   (tsx --env-file=.env.local src/db/seed.ts)
// Prices in KOBO (₦ x 100). Replace placeholder Unsplash images + products with the real stock later.
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema';
import { products } from './schema';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Please provide it in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const img = (id: string) => `https://images.unsplash.com/${id}?w=900`;

const rows: (typeof products.$inferInsert)[] = [
  { slug: 'aurelian-automatic', name: 'Aurelian Automatic', brand: 'Meridian', category: 'dress', priceKobo: 45_000_000, stock: 8, featured: true,
    movement: 'Automatic', caseSizeMm: 40, strap: 'Brown leather', waterResistance: '50m', imageUrl: img('photo-1523170335258-f5ed11844a49'),
    description: 'A refined dress watch with a sunburst champagne dial and sapphire crystal. Slim profile that slips under a cuff.' },
  { slug: 'noir-chronograph', name: 'Noir Chronograph', brand: 'Meridian', category: 'sport', priceKobo: 62_000_000, stock: 5, featured: true,
    movement: 'Quartz chronograph', caseSizeMm: 43, strap: 'Stainless steel', waterResistance: '100m', imageUrl: img('photo-1524592094714-0f0654e20314'),
    description: 'Matte black chronograph with tachymeter bezel. Built for the weekend and the boardroom.' },
  { slug: 'heritage-classic', name: 'Heritage Classic', brand: 'Meridian', category: 'classic', priceKobo: 28_000_000, stock: 12, featured: true,
    movement: 'Quartz', caseSizeMm: 38, strap: 'Black leather', waterResistance: '30m', imageUrl: img('photo-1547996160-81dfa63595aa'),
    description: 'Timeless three-hand design with Roman numerals and a domed crystal.' },
  { slug: 'vector-smart', name: 'Vector Smart', brand: 'Meridian', category: 'smart', priceKobo: 19_500_000, stock: 20, featured: true,
    movement: 'Digital', caseSizeMm: 44, strap: 'Silicone', waterResistance: '50m', imageUrl: img('photo-1579586337278-3befd40fd17a'),
    description: 'Everyday smartwatch with heart-rate tracking, notifications and a 7-day battery.' },
  { slug: 'oceanic-diver', name: 'Oceanic Diver', brand: 'Meridian', category: 'sport', priceKobo: 78_000_000, stock: 3,
    movement: 'Automatic', caseSizeMm: 42, strap: 'Rubber', waterResistance: '300m', imageUrl: img('photo-1533139502658-0198f920d8e8'),
    description: 'Professional-grade diver with unidirectional bezel and luminous markers.' },
  { slug: 'slate-minimal', name: 'Slate Minimal', brand: 'Meridian', category: 'dress', priceKobo: 23_500_000, stock: 10,
    movement: 'Quartz', caseSizeMm: 36, strap: 'Mesh steel', waterResistance: '30m', imageUrl: img('photo-1542496658-e33a6d0d50f6'),
    description: 'Clean, dial-first minimalism with a mesh bracelet.' },
  { slug: 'regent-gold', name: 'Regent Gold', brand: 'Meridian', category: 'classic', priceKobo: 89_000_000, stock: 2,
    movement: 'Automatic', caseSizeMm: 41, strap: 'Gold-tone steel', waterResistance: '50m', imageUrl: img('photo-1587836374828-4dbafa94cf0e'),
    description: 'Gold-tone case with a deep green dial. A statement piece.' },
  { slug: 'pulse-fit', name: 'Pulse Fit', brand: 'Meridian', category: 'smart', priceKobo: 14_500_000, stock: 15,
    movement: 'Digital', caseSizeMm: 42, strap: 'Silicone', waterResistance: '50m', imageUrl: img('photo-1544117519-31a4b719223d'),
    description: 'Lightweight fitness-first smartwatch with GPS and sleep tracking.' },
];

async function main() {
  await db.insert(products).values(rows).onConflictDoNothing({ target: products.slug });
  console.log(`Seeded ${rows.length} products`);
  process.exit(0);
}
main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
