# Coachly · Session Handoff

> อ่านไฟล์นี้เป็นอันดับแรกในทุก session ใหม่
> Last updated: 2026-05-02 · Branch: `claude/build-coachly-coach-ZBpRx`
> Last commit: system-v2 shipped; 40 food eval cases; chat UX fixes; BaoWio seeded

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

| Area                              | Status                                     | Notes                                                                                   |
| --------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| Project guide (CLAUDE.md)         | ✅                                         | rules + topics referenced                                                               |
| Rule docs (.claude/rules/)        | ✅ working-principles + backend + frontend | types.md + git-workflow.md สร้างเมื่อจำเป็น                                             |
| **Topic docs (.claude/topics/)**  | ✅ **ครบทุกอัน**                           | owner-confirmed 2026-05-02                                                              |
| Design analysis                   | ✅ docs/DESIGN_ANALYSIS.md                 | 7 screens, tokens, interactions                                                         |
| DB schema                         | ✅ lib/db/schema.ts + migrations applied   | 20 tables, 22 FKs, 43 indexes; migration 0002 applied (19 nutrient cols)                |
| Design tokens + shared components | ✅                                         | 1:1 port จาก design handoff                                                             |
| Auth.js v5 (LINE + Google)        | ✅                                         | JWT session, signIn callback                                                            |
| Onboarding flow                   | ✅ /onboarding → /plan-preview → /today    | 9-turn → DB → real targets                                                              |
| /today RSC                        | ✅ real data                               | kcal/water/mood wired; weight log via weigh_in tool                                     |
| /plan RSC                         | ✅ real data                               | findActive() → enriched exercises → buildScreenPlan()                                   |
| /chat                             | ✅ UX fixed                                | typing bubble in message list; scroll-to-bottom on load+response; food confirm card v2  |
| **/me page**                      | ✅ **real data**                           | RSC → profile data; avatar initials; macro bars; sign out                               |
| Tabbar layout                     | ✅ fixed                                   | Today/Plan ใช้ height:100dvh แล้ว; BottomTabBar pin ที่ footer                          |
| AI tools (6 tools)                | ✅                                         | search_food, log_food, log_water, weigh_in, set_mood, log_exercise                      |
| Tool payload types                | ✅ shared-types.ts                         | client-safe; ไม่ pull DB code เข้า browser bundle                                       |
| **Eval harness**                  | ✅ **57 golden cases**                     | 40 food + 17 other (incl. safety L1/L2, deload); mustContainOneOf + notInResponse check |
| Exercise seed                     | ✅ pnpm db:seed                            | 19 exercises (gym/home_eq/bodyweight)                                                   |
| **Thai food seed**                | ✅ **323 rows seeded**                     | BaoWio 1,005 fetched → 323 complete rows; CC-BY-SA 4.0                                  |
| USDA food resolver                | ✅ lib/services/food-resolver.ts           | Thai DB → USDA chain; 3s timeout; missing key → skip silently                           |
| MOPH 2018 schema + seed           | ✅ migration 0002 applied                  | 19 nutrient cols on foods; seed script ready; extraction still running                  |
| **MOPH 2018 PDF extraction**      | ⏳ **กำลัง run** (97 pages 26–122)         | pages 32–40+ cached (13 rows/page); pages 26–31 empty (likely intro pages)              |
| **System prompt**                 | ✅ **v2 live**                             | L1/L2 ED triggers exact; DMH 1323 template; deload keywords; log_food "ไม่บันทึกก่อน"   |
| Workout repos                     | ✅                                         | findActive, session lifecycle, bulk createMany                                          |
| /workout/run                      | ✅ real data                               | RSC → findActive plan → create session → RunClient → saveWorkoutAction                  |
| Inngest / PWA / offline           | ❌ Phase 3–4                               | deferred                                                                                |

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

1. **MOPH 2018 seed — ขั้นตอนที่เหลือ**
   - extraction กำลัง run อยู่ (Kimi K2.6 vision, 97 pages 26–122)
   - ถ้า extraction ยังไม่เสร็จ:
     ```bash
     KIMI_API_KEY=$(grep KIMI_API_KEY .env.local | cut -d= -f2) \
       scripts/.venv/bin/python scripts/extract_thai_nutrition_pdf.py > /tmp/kimi_extract.log 2>&1 &
     ```

     - venv อยู่ที่ `scripts/.venv/` (pdf2image + openai installed)
     - pages 26–31 อาจเป็น intro/legend — ถ้าได้ [] ทุกครั้งถือว่าปกติ
   - เมื่อ extraction เสร็จ (all_foods.json มีแถว):
     ```bash
     pnpm db:seed:moph2018    # seed จาก scripts/extracted/all_foods.json
     ```
   - **migration 0002 applied แล้ว** — ไม่ต้อง db:migrate อีก

2. **รัน pnpm eval กับ system-v2** — 57 cases ยังไม่ได้รันหลัง v2 ship
   - `pnpm eval --filter food` → ตรวจ 40 food cases
   - `pnpm eval --filter safety` → ตรวจ 4 safety cases (L1/L2/deload)
   - target: pass rate ≥ 90%

3. **Inngest / PWA / offline** — Phase 3 (deferred)

## Critical known bugs / debt

- **`@next/next/no-img-element`** (2x) ใน chat-client.tsx — pre-existing; แก้ตอน refactor ไป `next/image`
- **`@next/next/no-page-custom-font`** ใน layout.tsx — แก้ตอน migrate ไป `next/font/google`
- **workout_plans อาจว่าง** สำหรับ user เก่า — plan-generator trigger หลัง onboarding เท่านั้น; `/plan` fallback → DEFAULT_PLAN
- **body photo** — Kimi วิเคราะห์แล้วเก็บเป็น text ตาม pdpa.md; ยังไม่ implement `attachments` cleanup job

## Architecture quick-ref

```
lib/ai/prompts/system-v2.ts         ← ACTIVE system prompt (v2); v1 preserved แต่ไม่ใช้
lib/ai/tools/shared-types.ts        ← payload types + MOOD_LABEL (client-safe, no DB imports)
lib/ai/tools/index.ts               ← createCoachTools(userId) — server only
lib/services/food-resolver.ts       ← Thai DB → USDA fallback chain
app/chat/chat-client.tsx            ← typing bubble; scroll-to-bottom; food confirm card v2
app/me/{page,me-client,actions}.tsx ← RSC + client island + signOut action
app/workout/run/{page,run-client,actions}.tsx ← RSC + RunClient + saveWorkoutAction
components/screens/today-screen.tsx ← height:100dvh (tabbar fixed)
components/screens/plan-screen.tsx  ← height:100dvh (tabbar fixed)
components/screens/workout-run-screen.tsx ← export Ex, DEFAULT_RUN_PLAN; accept initialPlan+onSave
scripts/seed-thai-foods.ts          ← pnpm db:seed:foods (BaoWio — already seeded 323 rows)
scripts/seed-moph2018.ts            ← pnpm db:seed:moph2018 (reads scripts/extracted/all_foods.json)
scripts/extract_thai_nutrition_pdf.py ← Kimi K2.6 vision; venv: scripts/.venv/
tests/eval/golden/food.json         ← 40 Thai food cases
tests/eval/golden/other.json        ← 17 other cases incl. safety_001-004, deload_001-002
```

## ห้าม (hard rules)

- ห้าม implement business logic จนกว่าจะมี `topics/*.md` ที่ confirm — **ตอนนี้ครบแล้ว**
- ห้าม drive-by refactor inline styles → Tailwind ในคอมมิตเดียวกับ feature
- ห้าม return raw DB row จาก API
- ห้ามเดาชื่อ column/FK — เปิดอ่าน `lib/db/schema.ts` ก่อน
- ห้าม import จาก `lib/ai/tools` ใน client components — ใช้ `lib/ai/tools/shared-types` แทน
- ห้าม send PII ไป Kimi — ใช้ user_id_hash + numeric profile เท่านั้น
- ห้ามแก้ auto-generated: `drizzle/migrations/*.sql`, `*.generated.ts`, `next-env.d.ts`
