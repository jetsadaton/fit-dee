// Drizzle client backed by Neon serverless HTTP driver.
// Edge-runtime compatible (no TCP, single round-trip per query) — use this for
// reads and Server Actions. Stream/transaction-heavy paths (chat streaming,
// Inngest jobs) will add a pool-backed client in Phase 2 alongside the AI layer.

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon recommends fetch caching disabled for transactional reads.
neonConfig.fetchConnectionCache = true;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Throw lazily so `next build` (which doesn't connect) keeps working.
  // Any real query path will surface this immediately.
  throw new Error('DATABASE_URL is required. Set it in .env.local (see .env.example) before importing lib/db/client.');
}

const sql = neon(databaseUrl);

export const db = drizzle(sql, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export type Db = typeof db;
