CREATE TABLE IF NOT EXISTS "ai_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"range" text NOT NULL,
	"for_date" date NOT NULL,
	"items" jsonb NOT NULL,
	"prompt_version" text NOT NULL,
	"kimi_request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"blob_url" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"vision_result" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"ip_hash" text NOT NULL,
	"user_agent" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_summaries" (
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"kcal_eaten" smallint DEFAULT 0 NOT NULL,
	"kcal_target" smallint NOT NULL,
	"kcal_burned" smallint DEFAULT 0 NOT NULL,
	"protein_g" numeric(5, 2) DEFAULT '0' NOT NULL,
	"carb_g" numeric(5, 2) DEFAULT '0' NOT NULL,
	"fat_g" numeric(5, 2) DEFAULT '0' NOT NULL,
	"water_ml" integer DEFAULT 0 NOT NULL,
	"water_goal_ml" integer DEFAULT 2000 NOT NULL,
	"mood_energy" smallint,
	"workout_done" boolean DEFAULT false NOT NULL,
	"weight_kg" numeric(5, 2),
	"ai_summary" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_summaries_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exercise_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid,
	"exercise_semantic_id" text NOT NULL,
	"exercise_name_snapshot" text NOT NULL,
	"set_idx" smallint NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"reps" smallint NOT NULL,
	"rest_sec" smallint,
	"note" text,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"semantic_id" text NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text NOT NULL,
	"muscle_groups" text[] DEFAULT '{}' NOT NULL,
	"equipment" text[] DEFAULT '{}' NOT NULL,
	"default_sets" smallint NOT NULL,
	"default_reps" text NOT NULL,
	"default_rest_sec" smallint NOT NULL,
	"tip_th" text,
	"form_cues_th" text[] DEFAULT '{}' NOT NULL,
	"video_url" text,
	"source" text DEFAULT 'curated' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_semantic_id_unique" UNIQUE("semantic_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "food_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"food_id" uuid,
	"meal_type" text NOT NULL,
	"portion_g" smallint,
	"kcal" smallint NOT NULL,
	"kcal_low" smallint,
	"kcal_high" smallint,
	"protein_g" numeric(5, 2) NOT NULL,
	"carb_g" numeric(5, 2) NOT NULL,
	"fat_g" numeric(5, 2) NOT NULL,
	"source" text NOT NULL,
	"photo_id" uuid,
	"confirmed_at" timestamp with time zone,
	"logged_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"semantic_id" text NOT NULL,
	"name_th" text NOT NULL,
	"name_en" text,
	"kcal_per_100g" smallint NOT NULL,
	"protein_g_per_100g" numeric(5, 2) NOT NULL,
	"carb_g_per_100g" numeric(5, 2) NOT NULL,
	"fat_g_per_100g" numeric(5, 2) NOT NULL,
	"default_portion_g" smallint,
	"source" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"owner_user_id" uuid,
	"embedding" vector(768),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "foods_semantic_id_unique" UNIQUE("semantic_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"target_value" numeric(8, 2) NOT NULL,
	"start_value" numeric(8, 2) NOT NULL,
	"current_value" numeric(8, 2) NOT NULL,
	"unit" text NOT NULL,
	"deadline" date,
	"invert" boolean DEFAULT false NOT NULL,
	"achieved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memory_blocks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"profile_block" text DEFAULT '' NOT NULL,
	"summary_7d" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"version" smallint DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text,
	"tool_calls" jsonb,
	"attachments" uuid[] DEFAULT '{}' NOT NULL,
	"kimi_request_id" text,
	"token_in" smallint,
	"token_out" smallint,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mood_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"energy" smallint NOT NULL,
	"note" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "streaks" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current" smallint DEFAULT 0 NOT NULL,
	"longest" smallint DEFAULT 0 NOT NULL,
	"last_active_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"sex" text NOT NULL,
	"age" smallint NOT NULL,
	"height_cm" smallint NOT NULL,
	"weight_kg_initial" numeric(5, 2) NOT NULL,
	"target_weight_kg" numeric(5, 2) NOT NULL,
	"goal" text NOT NULL,
	"days_per_week" smallint NOT NULL,
	"activity_level" text NOT NULL,
	"equipment" text NOT NULL,
	"injuries" text[] DEFAULT '{}' NOT NULL,
	"tdee_kcal" smallint,
	"kcal_target" smallint,
	"protein_g_target" smallint,
	"carb_g_target" smallint,
	"fat_g_target" smallint,
	"plan_recalibrated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"line_sub" text,
	"google_sub" text,
	"email" "citext",
	"locale" text DEFAULT 'th' NOT NULL,
	"consents" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_line_sub_unique" UNIQUE("line_sub"),
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "water_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ml" smallint NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "weight_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"body_fat_pct" numeric(4, 1),
	"source" text DEFAULT 'manual' NOT NULL,
	"note" text,
	"logged_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workout_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_starts_on" date NOT NULL,
	"days" jsonb NOT NULL,
	"version" smallint DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid,
	"plan_day" text NOT NULL,
	"name" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"total_volume_kg" numeric(8, 2),
	"total_reps" smallint,
	"elapsed_sec" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachments" ADD CONSTRAINT "attachments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "foods" ADD CONSTRAINT "foods_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "memory_blocks" ADD CONSTRAINT "memory_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mood_logs" ADD CONSTRAINT "mood_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_plan_id_workout_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."workout_plans"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ai_insights_unique" ON "ai_insights" USING btree ("user_id","range","for_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attachments_user_kind_idx" ON "attachments" USING btree ("user_id","kind","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attachments_expiry_idx" ON "attachments" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_summaries_user_date_idx" ON "daily_summaries" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exercise_logs_session_idx" ON "exercise_logs" USING btree ("session_id","set_idx");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "exercises_semantic_idx" ON "exercises" USING btree ("semantic_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "food_logs_user_at_idx" ON "food_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "foods_semantic_idx" ON "foods" USING btree ("semantic_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "goals_user_idx" ON "goals" USING btree ("user_id","achieved_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_user_at_idx" ON "messages" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_thread_at_idx" ON "messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mood_logs_user_at_idx" ON "mood_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_deleted_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "water_logs_user_at_idx" ON "water_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weight_logs_user_at_idx" ON "weight_logs" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workout_plans_active_unique" ON "workout_plans" USING btree ("user_id","week_starts_on") WHERE "workout_plans"."active" = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workout_sessions_user_at_idx" ON "workout_sessions" USING btree ("user_id","started_at");