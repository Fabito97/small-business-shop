import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
// Run with: npx drizzle-kit push   (fast; fine for this project)
