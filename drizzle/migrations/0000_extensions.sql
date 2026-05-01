-- Required extensions (Neon Postgres 16). Order matters: extensions must exist
-- before subsequent migrations reference them (citext column on users.email,
-- vector(768) on foods.embedding, gen_random_uuid() defaults via pgcrypto).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "citext";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "vector";
