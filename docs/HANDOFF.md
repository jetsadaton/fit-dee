# Coachly · Session Handoff

> อ่านไฟล์นี้เป็นอันดับแรกในทุก session ใหม่
> Last updated: 2026-05-02 · Branch: `claude/build-coachly-coach-ZBpRx`
> Last commit: /workout/run wired to DB + food resolver chain + MOPH 2018 schema

## TL;DR — เปิด session ใหม่ทำตามนี้

```bash
# 1. ดึง branch ล่าสุด
git checkout claude/build-coachly-coach-ZBpRx
git pull origin claude/build-coachly-coach-ZBpRx

# 2. อ่านสามไฟล์นี้ตามลำดับ (15 นาที)
#    CLAUDE.md                         project guide + rules
#    docs/HANDOFF.md (this file)       state + next-actions
#    .claude/rules/working-principles.md, backend.md, frontend.md

# 3. รัน checks ก่อนแก้
pnpm install                          # ครั้งแรก
pnpm typecheck && pnpm lint           # ต้องผ่านก่อนเริ่ม
pnpm dev                              # http://localhost:3000
```

## Where we are — status snapshot

| Area                              | Status                                     | Notes                                                                  |
| --------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| Project guide (CLAUDE.md)         | ✅                                         | rules + topics referenced                                              |
| Rule docs (.claude/rules/)        | ✅ working-principles + backend + frontend | types.md + git-workflow.md สร้างเมื่อจำเป็น                            |
| **Topic docs (.claude/topics/)**  | ✅ **ครบทุกอัน**                           | owner-confirmed 2026-05-02                                             |
| Design analysis                   | ✅ docs/DESIGN_ANALYSIS.md                 | 7 screens, tokens, interactions                                        |
| DB schema                         | ✅ lib/db/schema.ts + migrations applied   | 20 tables, 22 FKs, 43 indexes                                          |
| Design tokens + shared components | ✅                                         | 1:1 port จาก design handoff                                            |
| Auth.js v5 (LINE + Google)        | ✅                                         | JWT session, signIn callback                                           |
| Onboarding flow                   | ✅ /onboarding → /plan-preview → /today    | 9-turn → DB → real targets                                             |
| /today RSC                        | ✅ real data                               | kcal/water/mood wired; weight log via weigh_in tool                    |
| /plan RSC                         | ✅ real data                               | findActive() → enriched exercises → buildScreenPlan()                  |
| /chat                             | ✅ Phase 2.5 complete                      | ChatScreen header/chips/composer; useChat + file upload + tool cards   |
| **/me page**                      | ✅ **real data**                           | RSC → profile data; avatar initials; macro bars; sign out              |
| Tabbar layout                     | ✅ fixed                                   | Today/Plan ใช้ height:100dvh แล้ว; BottomTabBar pin ที่ footer         |
| AI tools (6 tools)                | ✅                                         | search_food, log_food, log_water, weigh_in, set_mood, log_exercise     |
| Tool payload types                | ✅ shared-types.ts                         | client-safe; ไม่ pull DB code เข้า browser bundle                      |
| Eval harness                      | ✅ pnpm eval                               | 22 golden cases (10 food + 12 other incl. exercise)                    |
| Exercise seed                     | ✅ pnpm db:seed                            | 19 exercises (gym/home_eq/bodyweight)                                  |
| **Thai food seed**                | ✅ **pnpm db:seed:foods**                  | BaoWio 1,005 INMU rows; CC-BY-SA 4.0                                   |
| USDA food resolver                | ✅ lib/services/food-resolver.ts           | Thai DB → USDA chain; 3s timeout; missing key → skip silently          |
| MOPH 2018 schema + seed           | ✅ migration 0002 + seed-moph2018.ts       | 19 nutrient cols on foods; `pnpm db:seed:moph2018` (needs PDF extract) |
| Workout repos                     | ✅                                         | findActive, session lifecycle, bulk createMany                         |
| /workout/run                      | ✅ real data                               | RSC → findActive plan → create session → RunClient → saveWorkoutAction |
| Inngest / PWA / offline           | ❌ Phase 3–4                               | deferred                                                               |

## Topic docs — all owner-confirmed ✅

| File                                     | เนื้อหาหลัก                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| `.claude/topics/tdee-and-macros.md`      | Mifflin-St Jeor, deficit/surplus %, macro split                        |
| `.claude/topics/streak.md`               | นิยาม active day, reset rule                                           |
| `.claude/topics/safety-floors.md`        | 1200F/1500M kcal floor; L1/L2 ED triggers; DMH 1323                    |
| `.claude/topics/progressive-overload.md` | 2-session threshold; 2.5kg/1kg/+1rep; deload on signal                 |
| `.claude/topics/pdpa.md`                 | single checkbox; food photo 30d; body photo text-only; 30d soft-delete |
| `.claude/topics/food-db.md`              | precedence user_edit > vision_cache > Thai DB > USDA > LLM             |

## Next session — pick up here (in order)

1. **30+ Thai food golden eval cases** (รอ owner supply prompts)
   - ตอนนี้มี 10 food cases ใน `tests/eval/golden/food.json`
   - target 40+ รวม edge cases (ambiguous portion, restaurant vs home)

2. **system prompt v2** — เพิ่ม safety floors + progressive overload instructions
   - ปัจจุบัน v1 มี ED guardrails บางส่วน แต่ยังไม่ตรงกับ safety-floors.md ที่ confirm แล้ว
   - update `lib/ai/prompts/system-v1.ts` → `system-v2.ts` หลัง eval cases พร้อม

3. **MOPH 2018 seed** — ต้อง extract PDF ก่อน (`python scripts/extract_thai_nutrition_pdf.py`)
   - PDF อยู่ที่ root; output → `scripts/extracted/moph2018.json`
   - จากนั้น `pnpm db:seed:moph2018` และ `pnpm db:migrate` สำหรับ migration 0002

4. **`pnpm db:migrate`** — migration 0002 ยังไม่ apply (เพิ่ม 19 nutrient cols ใน foods)

## Critical known bugs / debt

- **`@next/next/no-img-element`** (2x) ใน chat-client.tsx — pre-existing; แก้ตอน refactor ไป `next/image`
- **`@next/next/no-page-custom-font`** ใน layout.tsx — แก้ตอน migrate ไป `next/font/google`
- **foods table ยังว่าง** — `pnpm db:seed:foods` รันแล้วจะมี 1,005 แถว แต่ยังไม่รัน (ต้อง `.env.local`)
- **workout_plans อาจว่าง** สำหรับ user เก่า — plan-generator trigger หลัง onboarding เท่านั้น; `/plan` fallback → DEFAULT_PLAN
- **body photo** — Kimi วิเคราะห์แล้วเก็บเป็น text ตาม pdpa.md; ยังไม่ implement `attachments` cleanup job

## Architecture quick-ref

```
lib/ai/tools/shared-types.ts        ← payload types + MOOD_LABEL (client-safe, no DB imports)
lib/ai/tools/index.ts               ← createCoachTools(userId) — server only
lib/services/food-resolver.ts       ← Thai DB → USDA fallback chain
app/chat/chat-client.tsx            ← import types จาก shared-types โดยตรง
app/me/{page,me-client,actions}.tsx ← RSC + client island + signOut action
app/workout/run/{page,run-client,actions}.tsx ← RSC + RunClient + saveWorkoutAction
components/screens/today-screen.tsx ← height:100dvh (tabbar fixed)
components/screens/plan-screen.tsx  ← height:100dvh (tabbar fixed)
components/screens/workout-run-screen.tsx ← export Ex, DEFAULT_RUN_PLAN; accept initialPlan+onSave
scripts/seed-thai-foods.ts          ← pnpm db:seed:foods (BaoWio HuggingFace API)
scripts/seed-moph2018.ts            ← pnpm db:seed:moph2018 (ต้อง extract PDF ก่อน)
```

## ห้าม (hard rules)

- ห้าม implement business logic จนกว่าจะมี `topics/*.md` ที่ confirm — **ตอนนี้ครบแล้ว**
- ห้าม drive-by refactor inline styles → Tailwind ในคอมมิตเดียวกับ feature
- ห้าม return raw DB row จาก API
- ห้ามเดาชื่อ column/FK — เปิดอ่าน `lib/db/schema.ts` ก่อน
- ห้าม import จาก `lib/ai/tools` ใน client components — ใช้ `lib/ai/tools/shared-types` แทน
- ห้าม send PII ไป Kimi — ใช้ user_id_hash + numeric profile เท่านั้น
- ห้ามแก้ auto-generated: `drizzle/migrations/*.sql`, `*.generated.ts`, `next-env.d.ts`
