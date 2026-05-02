import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// citext (case-insensitive text) — requires `CREATE EXTENSION citext`
const citext = customType<{ data: string; driverData: string }>({
  dataType: () => 'citext',
});

// pgvector — requires `CREATE EXTENSION vector`
const vector = (dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType: () => `vector(${dimensions})`,
  })();

// ─── identity & profile ──────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lineSub: text('line_sub').unique(),
    googleSub: text('google_sub').unique(),
    email: citext('email').unique(),
    locale: text('locale').notNull().default('th'),
    consents: jsonb('consents').notNull().default(sql`'{}'::jsonb`),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    deletedIdx: index('users_deleted_idx').on(t.deletedAt),
  }),
);

export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  sex: text('sex').notNull(), // 'm' | 'f' | 'o'
  age: smallint('age').notNull(),
  heightCm: smallint('height_cm').notNull(),
  weightKgInitial: numeric('weight_kg_initial', { precision: 5, scale: 2 }).notNull(),
  targetWeightKg: numeric('target_weight_kg', { precision: 5, scale: 2 }).notNull(),
  goal: text('goal').notNull(), // 'lose' | 'gain' | 'fit'
  daysPerWeek: smallint('days_per_week').notNull(),
  activityLevel: text('activity_level').notNull(), // 'sit'|'walk'|'move'|'active'
  equipment: text('equipment').notNull(), // 'gym'|'home_eq'|'home'
  injuries: text('injuries').array().notNull().default(sql`'{}'`),
  tdeeKcal: smallint('tdee_kcal'),
  kcalTarget: smallint('kcal_target'),
  proteinGTarget: smallint('protein_g_target'),
  carbGTarget: smallint('carb_g_target'),
  fatGTarget: smallint('fat_g_target'),
  planRecalibratedAt: timestamp('plan_recalibrated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── health logs ─────────────────────────────────────────────────────

export const weightLogs = pgTable(
  'weight_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    weightKg: numeric('weight_kg', { precision: 5, scale: 2 }).notNull(),
    bodyFatPct: numeric('body_fat_pct', { precision: 4, scale: 1 }),
    source: text('source').notNull().default('manual'),
    note: text('note'),
    loggedAt: timestamp('logged_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUserDate: index('weight_logs_user_at_idx').on(t.userId, t.loggedAt),
  }),
);

export const waterLogs = pgTable(
  'water_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ml: smallint('ml').notNull(),
    loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUserDate: index('water_logs_user_at_idx').on(t.userId, t.loggedAt),
  }),
);

export const moodLogs = pgTable(
  'mood_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    energy: smallint('energy').notNull(), // 1..5
    note: text('note'),
    loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUserDate: index('mood_logs_user_at_idx').on(t.userId, t.loggedAt),
  }),
);

// ─── food ────────────────────────────────────────────────────────────

export const foods = pgTable(
  'foods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    semanticId: text('semantic_id').notNull().unique(),
    nameTh: text('name_th').notNull(),
    nameEn: text('name_en'),
    kcalPer100g: smallint('kcal_per_100g').notNull(),
    proteinGPer100g: numeric('protein_g_per_100g', { precision: 5, scale: 2 }).notNull(),
    carbGPer100g: numeric('carb_g_per_100g', { precision: 5, scale: 2 }).notNull(),
    fatGPer100g: numeric('fat_g_per_100g', { precision: 5, scale: 2 }).notNull(),
    // Proximate
    waterGPer100g: numeric('water_g_per_100g', { precision: 5, scale: 2 }),
    fiberGPer100g: numeric('fiber_g_per_100g', { precision: 5, scale: 2 }),
    sugarGPer100g: numeric('sugar_g_per_100g', { precision: 5, scale: 2 }),
    ashGPer100g: numeric('ash_g_per_100g', { precision: 5, scale: 2 }),
    // Minerals
    calciumMgPer100g: numeric('calcium_mg_per_100g', { precision: 7, scale: 2 }),
    phosphorusMgPer100g: numeric('phosphorus_mg_per_100g', { precision: 7, scale: 2 }),
    magnesiumMgPer100g: numeric('magnesium_mg_per_100g', { precision: 7, scale: 2 }),
    sodiumMgPer100g: numeric('sodium_mg_per_100g', { precision: 7, scale: 2 }),
    potassiumMgPer100g: numeric('potassium_mg_per_100g', { precision: 7, scale: 2 }),
    ironMgPer100g: numeric('iron_mg_per_100g', { precision: 8, scale: 3 }),
    copperMgPer100g: numeric('copper_mg_per_100g', { precision: 8, scale: 3 }),
    zincMgPer100g: numeric('zinc_mg_per_100g', { precision: 8, scale: 3 }),
    iodineUgPer100g: numeric('iodine_ug_per_100g', { precision: 7, scale: 2 }),
    // Vitamins
    vitaminAUgRaePer100g: numeric('vitamin_a_ug_rae_per_100g', { precision: 7, scale: 2 }),
    thiaminMgPer100g: numeric('thiamin_mg_per_100g', { precision: 8, scale: 3 }),
    riboflavinMgPer100g: numeric('riboflavin_mg_per_100g', { precision: 8, scale: 3 }),
    niacinMgPer100g: numeric('niacin_mg_per_100g', { precision: 8, scale: 2 }),
    vitaminCMgPer100g: numeric('vitamin_c_mg_per_100g', { precision: 8, scale: 2 }),
    vitaminEMgPer100g: numeric('vitamin_e_mg_per_100g', { precision: 8, scale: 2 }),
    defaultPortionG: smallint('default_portion_g'),
    source: text('source').notNull(), // 'usda' | 'thai_db' | 'user' | 'llm_estimate'
    verified: boolean('verified').notNull().default(false),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    embedding: vector(768),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bySemantic: index('foods_semantic_idx').on(t.semanticId),
  }),
);

export const foodLogs = pgTable(
  'food_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id').references(() => foods.id, { onDelete: 'set null' }),
    mealType: text('meal_type').notNull(), // 'breakfast'|'lunch'|'dinner'|'snack'
    portionG: smallint('portion_g'),
    kcal: smallint('kcal').notNull(),
    kcalLow: smallint('kcal_low'),
    kcalHigh: smallint('kcal_high'),
    proteinG: numeric('protein_g', { precision: 5, scale: 2 }).notNull(),
    carbG: numeric('carb_g', { precision: 5, scale: 2 }).notNull(),
    fatG: numeric('fat_g', { precision: 5, scale: 2 }).notNull(),
    nameTh: text('name_th'), // display name for the food list; coalesced with foods.name_th for linked items
    source: text('source').notNull(), // 'chat_text'|'photo'|'manual'
    photoId: uuid('photo_id'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    loggedAt: timestamp('logged_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    byUserDate: index('food_logs_user_at_idx').on(t.userId, t.loggedAt),
  }),
);

// ─── workouts ────────────────────────────────────────────────────────

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    semanticId: text('semantic_id').notNull().unique(),
    nameTh: text('name_th').notNull(),
    nameEn: text('name_en').notNull(),
    muscleGroups: text('muscle_groups').array().notNull().default(sql`'{}'`),
    equipment: text('equipment').array().notNull().default(sql`'{}'`),
    defaultSets: smallint('default_sets').notNull(),
    defaultReps: text('default_reps').notNull(), // '8-10'
    defaultRestSec: smallint('default_rest_sec').notNull(),
    tipTh: text('tip_th'),
    formCuesTh: text('form_cues_th').array().notNull().default(sql`'{}'`),
    videoUrl: text('video_url'),
    source: text('source').notNull().default('curated'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bySemantic: index('exercises_semantic_idx').on(t.semanticId),
  }),
);

export const workoutPlans = pgTable(
  'workout_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    weekStartsOn: date('week_starts_on').notNull(),
    days: jsonb('days').notNull(),
    version: smallint('version').notNull().default(1),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    activeUnique: uniqueIndex('workout_plans_active_unique')
      .on(t.userId, t.weekStartsOn)
      .where(sql`${t.active} = true`),
  }),
);

export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id').references(() => workoutPlans.id, { onDelete: 'set null' }),
    planDay: text('plan_day').notNull(), // 'mon'..'sun'
    name: text('name').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    totalVolumeKg: numeric('total_volume_kg', { precision: 8, scale: 2 }),
    totalReps: smallint('total_reps'),
    elapsedSec: integer('elapsed_sec'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    byUserDate: index('workout_sessions_user_at_idx').on(t.userId, t.startedAt),
  }),
);

export const exerciseLogs = pgTable(
  'exercise_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'set null' }),
    exerciseSemanticId: text('exercise_semantic_id').notNull(),
    exerciseNameSnapshot: text('exercise_name_snapshot').notNull(),
    setIdx: smallint('set_idx').notNull(),
    weightKg: numeric('weight_kg', { precision: 5, scale: 2 }).notNull(),
    reps: smallint('reps').notNull(),
    restSec: smallint('rest_sec'),
    note: text('note'),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bySession: index('exercise_logs_session_idx').on(t.sessionId, t.setIdx),
  }),
);

// ─── chat ────────────────────────────────────────────────────────────

export const chatThreads = pgTable('chat_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => chatThreads.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user'|'assistant'|'tool'|'system'
    content: text('content'),
    toolCalls: jsonb('tool_calls'),
    attachments: uuid('attachments').array().notNull().default(sql`'{}'`),
    kimiRequestId: text('kimi_request_id'),
    tokenIn: smallint('token_in'),
    tokenOut: smallint('token_out'),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    byUser: index('messages_user_at_idx').on(t.userId, t.createdAt),
    byThread: index('messages_thread_at_idx').on(t.threadId, t.createdAt),
  }),
);

export const memoryBlocks = pgTable('memory_blocks', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  profileBlock: text('profile_block').notNull().default(''),
  summary7d: text('summary_7d').notNull().default(''),
  notes: text('notes').notNull().default(''),
  version: smallint('version').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── attachments / blobs ─────────────────────────────────────────────

export const attachments = pgTable(
  'attachments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(), // 'food_photo'|'body_photo'|'equipment_photo'
    blobUrl: text('blob_url').notNull(),
    contentType: text('content_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    visionResult: jsonb('vision_result'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    byUserKind: index('attachments_user_kind_idx').on(t.userId, t.kind, t.createdAt),
    byExpiry: index('attachments_expiry_idx').on(t.expiresAt),
  }),
);

// ─── aggregations / gamification ─────────────────────────────────────

export const dailySummaries = pgTable(
  'daily_summaries',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    kcalEaten: smallint('kcal_eaten').notNull().default(0),
    kcalTarget: smallint('kcal_target').notNull(),
    kcalBurned: smallint('kcal_burned').notNull().default(0),
    proteinG: numeric('protein_g', { precision: 5, scale: 2 }).notNull().default('0'),
    carbG: numeric('carb_g', { precision: 5, scale: 2 }).notNull().default('0'),
    fatG: numeric('fat_g', { precision: 5, scale: 2 }).notNull().default('0'),
    waterMl: integer('water_ml').notNull().default(0),
    waterGoalMl: integer('water_goal_ml').notNull().default(2000),
    moodEnergy: smallint('mood_energy'),
    workoutDone: boolean('workout_done').notNull().default(false),
    weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
    aiSummary: text('ai_summary'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.date] }),
    byUserDateDesc: index('daily_summaries_user_date_idx').on(t.userId, t.date),
  }),
);

export const streaks = pgTable('streaks', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  current: smallint('current').notNull().default(0),
  longest: smallint('longest').notNull().default(0),
  lastActiveDate: date('last_active_date'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const goals = pgTable(
  'goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(), // 'weight'|'protein_avg'|'workout_days'|'water_avg'
    targetValue: numeric('target_value', { precision: 8, scale: 2 }).notNull(),
    startValue: numeric('start_value', { precision: 8, scale: 2 }).notNull(),
    currentValue: numeric('current_value', { precision: 8, scale: 2 }).notNull(),
    unit: text('unit').notNull(),
    deadline: date('deadline'),
    invert: boolean('invert').notNull().default(false),
    achievedAt: timestamp('achieved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUser: index('goals_user_idx').on(t.userId, t.achievedAt),
  }),
);

export const aiInsights = pgTable(
  'ai_insights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    range: text('range').notNull(), // 'today'|'week'|'month'
    forDate: date('for_date').notNull(),
    items: jsonb('items').notNull(),
    promptVersion: text('prompt_version').notNull(),
    kimiRequestId: text('kimi_request_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    uniqueRange: uniqueIndex('ai_insights_unique').on(t.userId, t.range, t.forDate),
  }),
);

// ─── operational ─────────────────────────────────────────────────────

// ─── AI insights cache ───────────────────────────────────────────────
// Pre-generated per (userId, range, dateIct). weekly-insights Inngest job
// populates this; fetchInsightsAction reads here first to avoid per-request
// LLM calls. TTL enforced by read-side: stale if generated_at > 12h old.

export const insightsCache = pgTable(
  'insights_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    range: text('range').notNull(), // 'today' | 'week' | 'month'
    dateIct: text('date_ict').notNull(), // YYYY-MM-DD ICT
    insights: jsonb('insights').notNull(), // Insight[]
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: uniqueIndex('insights_cache_user_range_date_idx').on(t.userId, t.range, t.dateIct),
    byUser: index('insights_cache_user_idx').on(t.userId, t.generatedAt),
  }),
);

// ─── push subscriptions ──────────────────────────────────────────────
// One row per browser/device. endpoint is globally unique per W3C spec.

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byEndpoint: uniqueIndex('push_subs_endpoint_idx').on(t.endpoint),
    byUser: index('push_subs_user_idx').on(t.userId),
  }),
);

// ─── operational ─────────────────────────────────────────────────────

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    ipHash: text('ip_hash').notNull(),
    userAgent: text('user_agent'),
    meta: jsonb('meta').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byUser: index('audit_logs_user_idx').on(t.userId, t.createdAt),
  }),
);
