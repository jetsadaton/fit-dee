CREATE TABLE IF NOT EXISTS "insights_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"range" text NOT NULL,
	"date_ict" text NOT NULL,
	"insights" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "insights_cache" ADD CONSTRAINT "insights_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "insights_cache_user_range_date_idx" ON "insights_cache" USING btree ("user_id","range","date_ict");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "insights_cache_user_idx" ON "insights_cache" USING btree ("user_id","generated_at");