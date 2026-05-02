# Coachly · Session Handoff

> อ่านไฟล์นี้เป็นอันดับแรกในทุก session ใหม่
> Last updated: 2026-05-03 · Branch: `claude/build-coachly-coach-ZBpRx`
> Last commit: fix(pdpa): attachments 30d expiry + nightly memory/streak/recalibration

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

| Area                              | Status                                     | Notes                                                                                                |
| --------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Project guide (CLAUDE.md)         | ✅                                         | rules + topics referenced                                                                            |
| Rule docs (.claude/rules/)        | ✅ working-principles + backend + frontend | types.md + git-workflow.md สร้างเมื่อจำเป็น                                                          |
| **Topic docs (.claude/topics/)**  | ✅ **ครบทุกอัน**                           | owner-confirmed 2026-05-02                                                                           |
| Design analysis                   | ✅ docs/DESIGN_ANALYSIS.md                 | 7 screens, tokens, interactions                                                                      |
| DB schema                         | ✅ lib/db/schema.ts + migrations applied   | 20 tables, 22 FKs, 43 indexes; migration 0002 applied (19 nutrient cols)                             |
| Design tokens + shared components | ✅                                         | 1:1 port จาก design handoff                                                                          |
| Auth.js v5 (LINE + Google)        | ✅                                         | JWT session, signIn callback                                                                         |
| Onboarding flow                   | ✅ /onboarding → /plan-preview → /today    | 9-turn → DB → real targets                                                                           |
| /today RSC                        | ✅ real data — ทุก tab                     | วันนี้: MacroBar+WeightTrend+WorkoutCTA; สัปดาห์/เดือน: stats จริงทั้งหมด                            |
| **AIInsightCard**                 | ✅ **real AI insights**                    | moonshot-v1-8k; Server Action + useQuery; skeleton → real → hardcode fallback; staleTime:Infinity    |
| **MonthHeatmap**                  | ✅ **real activity data**                  | level 0-3 per day (food/workout/kcal≥80%); datesWithWorkoutInRange repo; /canvas fallback            |
| **WeightTrend sparkline**         | ✅ **real weight_logs data**               | weightSeriesKg oldest→newest; hasSpark≥2; ซ่อน SVG เมื่อไม่มีข้อมูล (feedback rule)                  |
| /plan RSC                         | ✅ real data                               | findActive() → enriched exercises → buildScreenPlan()                                                |
| /chat                             | ✅ UX fixed                                | typing bubble in message list; scroll-to-bottom on load+response; food confirm card v2               |
| **/me page**                      | ✅ **real data**                           | RSC → profile data; avatar initials; macro bars; sign out                                            |
| Tabbar layout                     | ✅ fixed                                   | Today/Plan ใช้ height:100dvh แล้ว; BottomTabBar pin ที่ footer                                       |
| AI tools (7 tools)                | ✅                                         | search_food, log_food, log_water, weigh_in, set_mood, log_exercise, **update_profile**               |
| Tool payload types                | ✅ shared-types.ts                         | client-safe; ไม่ pull DB code เข้า browser bundle                                                    |
| **Eval harness**                  | ✅ **60/62 target (claude-haiku sim)**     | +3 update_profile cases added; system-v2.1+update_profile; pnpm eval:claude / pnpm eval              |
| Exercise seed                     | ✅ pnpm db:seed                            | 19 exercises (gym/home_eq/bodyweight)                                                                |
| **Thai food seed**                | ✅ **323 rows seeded**                     | BaoWio 1,005 fetched → 323 complete rows; CC-BY-SA 4.0                                               |
| USDA food resolver                | ✅ lib/services/food-resolver.ts           | Thai DB → USDA chain; 3s timeout; missing key → skip silently                                        |
| **MOPH 2018 seed**                | ✅ **857 foods in DB**                     | migration 0003 applied (precision fix); all_foods_fixed.json in scripts/extracted/                   |
| **System prompt**                 | ✅ **v2 live**                             | L1/L2 ED triggers exact; DMH 1323 template; deload keywords; log_food "ไม่บันทึกก่อน"                |
| Workout repos                     | ✅                                         | findActive, session lifecycle, bulk createMany                                                       |
| /workout/run                      | ✅ real data                               | RSC → findActive plan → create session → RunClient → saveWorkoutAction                               |
| **Inngest (6 functions)**         | ✅ **complete**                            | photo-expiry, weekly-insights (+push), plan-generator, nightly-streak, recalibration, nightly-memory |
| **PWA manifest + install prompt** | ✅ **shipped**                             | app/manifest.ts; icon 192×192; iOS/Android install prompt (after 2nd visit)                          |
| **Offline queue (Dexie)**         | ✅ **Phase 4**                             | lib/offline/db.ts + sync.ts; useSyncQueue; SyncQueueMonitor pill                                     |
| **Serwist service worker**        | ✅ **Phase 4**                             | app/sw.ts; withSerwist in next.config.ts (disabled dev); defaultCache                                |
| **Web Push**                      | ✅ **Phase 4**                             | VAPID keys; push_subscriptions table; /api/push/subscribe; usePushSubscription hook                  |
| **insights_cache**                | ✅ **Phase 4**                             | DB table + repo; fetchInsightsAction cache-first; weekly-insights writes cache + sends push          |
| **Push notification toggle**      | ✅ **Phase 4**                             | /me page: subscribe/unsubscribe UI; usePushSubscription hook                                         |
| **LINE OA webhook**               | ✅ **Phase 4**                             | /api/webhooks/line; HMAC verify; AI pipeline; LINE Reply API; needs LINE*CHANNEL*\* env vars         |

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

1. **เทส Phase 3–4 บน device จริง** — install PWA, offline queue, push
2. **LINE OA setup** — กรอก LINE_CHANNEL_SECRET + LINE_CHANNEL_ACCESS_TOKEN ใน .env.local
3. **pgvector food search** — embedding pipeline สำหรับ semantic food search (deferred, complex)
4. `pnpm eval` (Kimi real) — เมื่อ Kimi credits กลับมา

> Inngest local dev: `npx inngest-cli@latest dev` แล้วเปิด http://localhost:8288
> SW disabled ใน dev — `pnpm build && pnpm start` เพื่อทดสอบ service worker จริง
> Unit tests: `pnpm test` → 36/36 ✓

## Critical known bugs / debt

- **workout_plans อาจว่าง** สำหรับ user เก่า — `/plan` fallback → DEFAULT_PLAN (ยอมรับได้)
- **Attachments Blob ยัง public** — Phase 3 TODO: private Blob + signed URL (1d TTL)

## Architecture quick-ref

```
lib/ai/prompts/system-v2.ts         ← ACTIVE system prompt (v2+update_profile); v1 preserved แต่ไม่ใช้
lib/ai/tools/shared-types.ts        ← payload types + MOOD/GOAL/ACTIVITY/EQUIPMENT labels (client-safe)
lib/ai/tools/index.ts               ← createCoachTools(userId) — server only (7 tools)
lib/ai/tools/update_profile.ts      ← update_profile tool — reads profile+latest weight, computes TDEE preview
lib/db/repositories/profiles.ts     ← findByUserId, upsert, updatePlanFields (plan fields only, not identity)
lib/services/food-resolver.ts       ← Thai DB → USDA fallback chain
lib/services/insights.ts            ← generateInsights(snapshot, range) — moonshot-v1-8k, 25s timeout
lib/types/dto/insights.ts           ← Insight / InsightRange shared types
app/today/actions.ts                ← fetchInsightsAction(range) — auth + snapshot + generateInsights
app/today/today-client.tsx          ← useQuery insights.byRange; controlled range; passes to TodayScreen
app/chat/chat-client.tsx            ← typing bubble; scroll-to-bottom; food confirm card v2
app/me/{page,me-client,actions}.tsx ← RSC + client island + signOut action
app/workout/run/{page,run-client,actions}.tsx ← RSC + RunClient + saveWorkoutAction
components/screens/today-screen.tsx ← height:100dvh (tabbar fixed)
components/screens/plan-screen.tsx  ← height:100dvh (tabbar fixed)
components/screens/workout-run-screen.tsx ← export Ex, DEFAULT_RUN_PLAN; accept initialPlan+onSave
scripts/seed-thai-foods.ts          ← pnpm db:seed:foods (BaoWio — already seeded 323 rows)
scripts/seed-moph2018.ts            ← pnpm db:seed:moph2018 (reads scripts/extracted/all_foods_fixed.json)
scripts/extract_thai_nutrition_pdf.py ← Kimi K2.6 vision; venv: scripts/.venv/ (extraction done)
scripts/extracted/all_foods_fixed.json ← 893 foods; Thai names corrected; source of truth
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
