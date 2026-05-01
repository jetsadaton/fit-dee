# Coachly — Database Schema Plan

> Postgres 16 (Neon) + Drizzle ORM + pgvector. Source of truth = `lib/db/schema.ts`.
> All identifiers in English; Thai user-facing strings live in i18n JSON.

## 1. Design principles

1. **One aggregate per repository** — repositories ใน `lib/db/repositories/` มี 1 file ต่อ aggregate (foods, food-logs, plans, exercises, ...)
2. **Soft delete** — `deleted_at timestamptz null`; ห้าม hard-delete user-generated content (PDPA: ผู้ใช้ขอลบ → soft + tombstone)
3. **Audit columns** — ทุก table มี `created_at`, `updated_at` (default `now()`); user-mutable rows มี `updated_by` (= user_id)
4. **No PII to LLM** — `users.email`, `users.line_sub`, `users.google_sub` ห้ามส่งไป Kimi/Helicone. Coach context ใช้ `user_id_hash` (deterministic SHA-256 of `users.id`) + numeric profile only
5. **Semantic IDs for LLM** — `foods.semantic_id = 'thai_pad_kra_pao_chicken'`, `exercises.semantic_id = 'bench_press_barbell'` — LLM tool args ใช้ semantic_id ไม่ใช่ UUID
6. **Read models** — `daily_summaries` view/materialized table สำหรับ dashboard (ไม่อ่าน sum() บน food_logs ทุก request)
7. **Source-of-truth for foods** — precedence: `user_edit > vision_cache > usda > thai_db > llm_estimate` (ดู `topics/food-db.md` เมื่อ owner confirm)

## 2. Aggregates → tables

### Identity & profile

```
users
├── id              uuid pk
├── line_sub        text unique null     LINE Login subject
├── google_sub      text unique null     Google OAuth subject
├── email           citext unique null   normalized
├── locale          text default 'th'    'th' | 'en'
├── consents        jsonb                versioned: { tos: 'v1@2026-01-01', pdpa: 'v2@2026-04-15', marketing: false }
├── deleted_at      timestamptz null
├── created_at      timestamptz default now()
└── updated_at      timestamptz default now()

user_profiles                            one row per user
├── user_id         uuid pk fk users(id)
├── display_name    text                 "โบ้" — what coach calls them
├── sex             text                 'm' | 'f' | 'o'
├── age             smallint             validated 13–100 in app
├── height_cm       smallint
├── weight_kg_initial  numeric(5,2)      from onboarding
├── target_weight_kg   numeric(5,2)
├── goal            text                 'lose' | 'gain' | 'fit'
├── days_per_week   smallint             2..6
├── activity_level  text                 'sit' | 'walk' | 'move' | 'active'
├── equipment       text                 'gym' | 'home_eq' | 'home'
├── injuries        text[]               ['knee','shoulder',...]
├── tdee_kcal       smallint             computed; null until first calc
├── kcal_target     smallint
├── protein_g_target smallint
├── carb_g_target    smallint
├── fat_g_target     smallint
├── plan_recalibrated_at  timestamptz null  for 14-day recalibration cycle
├── created_at      timestamptz default now()
└── updated_at      timestamptz default now()
```

### Health logs

```
weight_logs
├── id              uuid pk
├── user_id         uuid fk users(id)
├── weight_kg       numeric(5,2)
├── body_fat_pct    numeric(4,1) null
├── source          text default 'manual'   'manual' | 'scale_sync'
├── logged_at       timestamptz             user-supplied (morning of)
├── created_at      timestamptz default now()
└── note            text null
INDEX (user_id, logged_at DESC)

water_logs
├── id              uuid pk
├── user_id         uuid fk users(id)
├── ml              smallint                250 / 500 / 750 / custom
├── logged_at       timestamptz default now()
└── created_at      timestamptz default now()
INDEX (user_id, logged_at DESC)

mood_logs
├── id              uuid pk
├── user_id         uuid fk users(id)
├── energy          smallint                1..5  (😩 → 🔥)
├── note            text null
├── logged_at       timestamptz default now()
└── created_at      timestamptz default now()
INDEX (user_id, logged_at DESC)
```

### Food

```
foods                                    catalog (shared across users)
├── id              uuid pk
├── semantic_id     text unique          'thai_pad_kra_pao_chicken'
├── name_th         text
├── name_en         text null
├── kcal_per_100g   smallint
├── protein_g_per_100g  numeric(5,2)
├── carb_g_per_100g     numeric(5,2)
├── fat_g_per_100g      numeric(5,2)
├── default_portion_g   smallint null    typical serving in g
├── source          text                 'usda' | 'thai_db' | 'user' | 'llm_estimate'
├── verified        boolean default false        true once human reviews
├── owner_user_id   uuid null fk users(id)        non-null only when source='user'
├── embedding       vector(768) null              pgvector — for "did you mean" search
├── created_at      timestamptz default now()
└── updated_at      timestamptz default now()
INDEX (semantic_id), INDEX USING ivfflat (embedding vector_cosine_ops)

food_logs
├── id              uuid pk
├── user_id         uuid fk users(id)
├── food_id         uuid fk foods(id) null     null if free-form one-off
├── meal_type       text                       'breakfast' | 'lunch' | 'dinner' | 'snack'
├── portion_g       smallint null              actual portion eaten
├── kcal            smallint                   resolved from food × portion (or llm estimate)
├── kcal_low        smallint null              for range "~450–550"
├── kcal_high       smallint null
├── protein_g       numeric(5,2)
├── carb_g          numeric(5,2)
├── fat_g           numeric(5,2)
├── source          text                       'chat_text' | 'photo' | 'manual'
├── photo_id        uuid null fk attachments(id)
├── confirmed_at    timestamptz null           null = pending coach-proposed log; non-null = user confirmed
├── logged_at       timestamptz                user-stated time of meal
├── created_at      timestamptz default now()
└── deleted_at      timestamptz null
INDEX (user_id, logged_at DESC)
PARTIAL INDEX (user_id, logged_at) WHERE confirmed_at IS NOT NULL
```

### Workouts & exercises

```
exercises                                catalog
├── id              uuid pk
├── semantic_id     text unique          'bench_press_barbell'
├── name_th         text
├── name_en         text
├── muscle_groups   text[]               ['chest','triceps','front_delt']
├── equipment       text[]               ['barbell','bench']  any-of
├── default_sets    smallint
├── default_reps    text                 '8-10' (range as text)
├── default_rest_sec smallint
├── tip_th          text null
├── form_cues_th    text[]               ['หลังแนบเบาะ','ลดบาร์ลงช้าๆ',...]
├── video_url       text null            CDN/blob path
├── source          text                 'curated' | 'llm_proposed'
├── created_at      timestamptz default now()
└── updated_at      timestamptz default now()
INDEX (semantic_id)

workout_plans                            current weekly plan (1 active per user)
├── id              uuid pk
├── user_id         uuid fk users(id)
├── week_starts_on  date                 Monday of the week
├── days            jsonb                {
│                                          "mon": { "name": "Push Day", "focus": "...", "mins": 45, "rest_day": false,
│                                                   "exercises": [
│                                                     { "exercise_id": "uuid", "semantic_id": "bench_press_barbell",
│                                                       "sets": 3, "reps": "8-10", "weight_kg_target": 60, "order": 0 },
│                                                     ...
│                                                   ]
│                                                 },
│                                          "tue": {...}, ..., "sun": { "rest_day": true }
│                                        }
├── version         smallint default 1   bumped on every AI swap / edit
├── active          boolean default true
├── created_at      timestamptz default now()
└── updated_at      timestamptz default now()
UNIQUE (user_id, week_starts_on, active) WHERE active = true

workout_sessions                         actual workout instance (started=clicked เริ่มเลย)
├── id              uuid pk
├── user_id         uuid fk users(id)
├── plan_id         uuid fk workout_plans(id)
├── plan_day        text                 'mon'..'sun'
├── name            text                 snapshot at start (plan can change after)
├── started_at      timestamptz
├── ended_at        timestamptz null
├── total_volume_kg numeric(8,2) null    sum(weight × reps)
├── total_reps      smallint null
├── elapsed_sec     int null
├── created_at      timestamptz default now()
└── deleted_at      timestamptz null
INDEX (user_id, started_at DESC)

exercise_logs                            one per set within a session
├── id              uuid pk
├── session_id      uuid fk workout_sessions(id) on delete cascade
├── exercise_id     uuid fk exercises(id) null
├── exercise_semantic_id  text           snapshot for fast lookup
├── exercise_name_snapshot text
├── set_idx         smallint             0-based
├── weight_kg       numeric(5,2)
├── reps            smallint
├── rest_sec        smallint null
├── completed_at    timestamptz default now()
└── note            text null
INDEX (session_id, set_idx)
```

### Chat & AI

```
chat_threads                             one per user is enough at MVP, but future-proof
├── id              uuid pk
├── user_id         uuid fk users(id)
├── title           text null            auto-generated from first user msg
├── last_message_at timestamptz default now()
├── created_at      timestamptz default now()
└── deleted_at      timestamptz null

messages
├── id              uuid pk
├── thread_id       uuid fk chat_threads(id) on delete cascade
├── user_id         uuid fk users(id)        denormalized for fast user-scoped queries
├── role            text                 'user' | 'assistant' | 'tool' | 'system'
├── content         text null            null if tool_calls only
├── tool_calls      jsonb null           [{ name, arguments, result }] OpenAI-style
├── attachments     uuid[] default '{}'  → attachments(id)
├── kimi_request_id text null            for Helicone trace lookup
├── token_in        smallint null
├── token_out       smallint null
├── latency_ms      int null
├── created_at      timestamptz default now()
└── deleted_at      timestamptz null
INDEX (user_id, created_at DESC)
INDEX (thread_id, created_at)

memory_blocks                            persistent memory injected into every prompt
├── user_id         uuid pk fk users(id)
├── profile_block   text                 frozen TDEE/macros line
├── summary_7d      text                 rolling 7-day summary, regenerated by Inngest
├── notes           text                 user-pinned notes ("แพ้ถั่ว", "ออกตอนเช้า")
├── updated_at      timestamptz default now()
└── version         smallint default 1
```

### Attachments & blobs

```
attachments                              Vercel Blob registry
├── id              uuid pk
├── user_id         uuid fk users(id)
├── kind            text                 'food_photo' | 'body_photo' | 'equipment_photo'
├── blob_url        text                 private bucket path
├── content_type    text
├── byte_size       int
├── vision_result   jsonb null           { items: [{ name, conf }], kcal: [low, high], description }
├── expires_at      timestamptz          private signed-URL TTL — deleted by Inngest
├── created_at      timestamptz default now()
└── deleted_at      timestamptz null
INDEX (user_id, kind, created_at DESC)
INDEX (expires_at) WHERE deleted_at IS NULL
```

### Aggregations & gamification

```
daily_summaries                          materialized read model — dashboard hits this
├── user_id         uuid fk users(id)
├── date            date                 in user's tz
├── kcal_eaten      smallint default 0
├── kcal_target     smallint
├── kcal_burned     smallint default 0   from workout_sessions est.
├── protein_g       numeric(5,2) default 0
├── carb_g          numeric(5,2) default 0
├── fat_g           numeric(5,2) default 0
├── water_ml        int default 0
├── water_goal_ml   int default 2000
├── mood_energy     smallint null
├── workout_done    boolean default false
├── weight_kg       numeric(5,2) null    morning weigh-in if any
├── ai_summary      text null            generated nightly by Inngest
├── updated_at      timestamptz default now()
└── PRIMARY KEY (user_id, date)
INDEX (user_id, date DESC)

streaks
├── user_id         uuid pk fk users(id)
├── current         smallint default 0   consecutive days meeting "active" criteria (TBD per topics/)
├── longest         smallint default 0
├── last_active_date date null
└── updated_at      timestamptz default now()

goals                                    user-set goals (weight, protein avg, days/wk, ...)
├── id              uuid pk
├── user_id         uuid fk users(id)
├── kind            text                 'weight' | 'protein_avg' | 'workout_days' | 'water_avg'
├── target_value    numeric(8,2)
├── start_value     numeric(8,2)
├── current_value   numeric(8,2)
├── unit            text                 'kg' | 'g' | 'days' | 'ml'
├── deadline        date null
├── invert          boolean              true if lower-is-better (weight loss)
├── achieved_at     timestamptz null
├── created_at      timestamptz default now()
└── updated_at      timestamptz default now()
INDEX (user_id, achieved_at)

ai_insights                              generated by Inngest job (today / week / month)
├── id              uuid pk
├── user_id         uuid fk users(id)
├── range           text                 'today' | 'week' | 'month'
├── for_date        date                 anchor day
├── items           jsonb                [{ tone: 'warn'|'good'|'info', text: 'ขาดโปรตีน 30g...' }, ...]
├── prompt_version  text                 'v3.2' — eval-tracked
├── kimi_request_id text null
├── created_at      timestamptz default now()
└── deleted_at      timestamptz null
UNIQUE (user_id, range, for_date)
```

### Rate limiting / audit (operational)

```
audit_logs                               for security review
├── id              uuid pk
├── user_id         uuid null fk users(id)
├── action          text                 'login' | 'consent_grant' | 'data_export' | 'account_delete'
├── ip_hash         text                 SHA-256 of IP — never raw
├── user_agent      text null
├── meta            jsonb default '{}'
└── created_at      timestamptz default now()
INDEX (user_id, created_at DESC)
```

> Rate-limiting state lives in **Upstash Redis**, not Postgres (per rules/backend.md).

## 3. Relationships (ERD-ish)

```
users 1───1 user_profiles
users 1───* weight_logs / water_logs / mood_logs / food_logs / messages / attachments / goals / ai_insights
users 1───1 streaks / memory_blocks
users 1───* workout_plans 1───* (jsonb day → exercises[])
users 1───* workout_sessions 1───* exercise_logs
users 1───* chat_threads 1───* messages
foods 1───* food_logs
exercises 1───* exercise_logs
attachments ──referenced from── food_logs.photo_id, messages.attachments[]
```

## 4. Migration order (Phase 0 → 1)

1. Enable extensions: `citext`, `pgcrypto`, `vector`
2. Create `users`, `user_profiles`
3. Create catalogs: `foods`, `exercises` (seed minimal Thai food + bench/squat/etc.)
4. Create `attachments`
5. Create logs: `weight_logs`, `water_logs`, `mood_logs`, `food_logs`
6. Create plans: `workout_plans`, `workout_sessions`, `exercise_logs`
7. Create chat: `chat_threads`, `messages`, `memory_blocks`
8. Create aggregations: `daily_summaries`, `streaks`, `goals`, `ai_insights`
9. Create `audit_logs`

Each step = 1 Drizzle generate + 1 reversible migration commit.

## 5. Indexes & performance

- Hot paths:
  - Today dashboard: `daily_summaries WHERE user_id = ? AND date = ?` — single PK lookup
  - Chat history: `messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 20` — covered by `(user_id, created_at DESC)`
  - Plan view: `workout_plans WHERE user_id = ? AND active = true` — single row
- Vector search:
  - `foods.embedding ivfflat lists=100` for ~1M rows; revisit at scale
- Partial indexes:
  - `food_logs(user_id, logged_at) WHERE confirmed_at IS NOT NULL` — exclude unconfirmed coach proposals from dashboard sums

## 6. Privacy & retention (PDPA)

- `consents` jsonb on `users`: `{ tos: 'v<n>@<date>', pdpa: 'v<n>@<date>', marketing: bool }` — version locked, never overwritten silently
- `attachments.expires_at` enforced by Inngest — defaults: food_photo 90d, body_photo 365d, equipment_photo 180d
- Account deletion: cascade soft-delete via `users.deleted_at`; hard-delete blob assets within 30 days; emit `audit_logs.action = 'account_delete'`
- Health data export: dump as ndjson zip, served via signed URL, 24h TTL (per `topics/pdpa.md` — TBD with owner)

## 7. Where Drizzle schema lives

```
lib/db/
├── schema.ts                # all tables + relations (Drizzle ORM v0.30+)
├── client.ts                # createDrizzleClient(url) → Neon HTTP for edge / pool for node
├── relations.ts             # explicit relations for join queries
└── repositories/
    ├── users.ts
    ├── profiles.ts
    ├── foods.ts
    ├── food-logs.ts
    ├── workout-plans.ts
    ├── workout-sessions.ts
    ├── chat.ts              # threads + messages
    ├── daily-summaries.ts
    └── ...
drizzle/
└── migrations/              # auto-generated by drizzle-kit
```

## 8. Things that are **NOT** in DB

- **Rate limit counters** → Upstash Redis (sliding window per user_id)
- **Vision result cache** → embedded into `foods` (when accepted) or `attachments.vision_result` (one-off)
- **System prompt versions** → `lib/ai/prompts/*.ts` (in code, eval-tracked) not DB
- **Tool schemas** → `lib/ai/tools/*.ts` (in code with Zod) not DB
- **Exercise videos / food photos** → Vercel Blob; DB only stores URL + meta in `attachments`
