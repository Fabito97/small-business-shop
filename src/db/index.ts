// src/db/index.ts: Neon via WebSocket Pool (needed for db.transaction()).
import 'server-only';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema';

// Node <= 21 has no global WebSocket; harmless on newer versions.
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool, { schema });
