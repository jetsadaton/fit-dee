# Coachly · Session Handoff

> อ่านไฟล์นี้เป็นอันดับแรกในทุก session ใหม่
> Last updated: 2026-05-03 · Branch: `claude/build-coachly-coach-ZBpRx`
> Last commit: fix(font) + fix(insights) — Thai font fix + remove hardcoded demo data

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
| DB schema                         | ✅ lib/db/schema.ts + migrations applied   | migration 0006: food_logs.name_th; total 22 tables                                                   |
| Design tokens + shared components | ✅                                         | 1:1 port จาก design handoff                                                                          |
| Auth.js v5 (LINE + Google)        | ✅ **persistent login**                    | JWT maxAge 30d + updateAge 1d — ไม่ต้อง login ซ้ำแล้ว                                                |
| Onboarding flow                   | ✅ /onboarding → /plan-preview → /today    | 9-turn → DB → real targets                                                                           |
| /today RSC                        | ✅ real data — ทุก tab                     | วันนี้: MacroBar+WeightTrend+WorkoutCTA; สัปดาห์/เดือน: stats จริงทั้งหมด                            |
| **Food log list**                 | ✅ **new this session**                    | FoodLogList ใน Today tab; group by meal; inline edit kcal/macro; inline delete confirm               |
| **Date navigation**               | ✅ **new this session**                    | < > buttons + calendar picker; past-day view (water/mood readonly, WorkoutCTA hidden)                |
| **AIInsightCard**                 | ✅ **fixed**                               | ลบ hardcoded demo data แล้ว; แสดง empty state เมื่อไม่มีข้อมูล; real AI เท่านั้น                     |
| **Font rendering**                | ✅ **fixed**                               | CSS variables (--font-inter, --font-noto-sans-thai) แก้ปัญหาภาษาจีน; 12 files, ~80 occurrences       |
| **MonthHeatmap**                  | ✅ **real activity data**                  | level 0-3 per day (food/workout/kcal≥80%)                                                            |
| **WeightTrend sparkline**         | ✅ **real weight_logs data**               | weightSeriesKg oldest→newest; hasSpark≥2                                                             |
| /plan RSC                         | ✅ real data                               | findActive() → enriched exercises → buildScreenPlan()                                                |
| /chat                             | ✅ UX fixed                                | typing bubble; scroll-to-bottom; food confirm card v2                                                |
| **/me page**                      | ✅ **real data**                           | RSC → profile data; avatar initials; macro bars; sign out                                            |
| Tabbar layout                     | ✅ fixed                                   | Today/Plan ใช้ height:100dvh; BottomTabBar pin ที่ footer                                            |
| AI tools (7 tools)                | ✅                                         | search_food, log_food, log_water, weigh_in, set_mood, log_exercise, **update_profile**               |
| Tool payload types                | ✅ shared-types.ts                         | client-safe; ไม่ pull DB code เข้า browser bundle                                                    |
| **Eval harness**                  | ✅ **60/62 target (claude-haiku sim)**     | +3 update_profile cases; system-v2.1+update_profile; pnpm eval:claude / pnpm eval                    |
| Exercise seed                     | ✅ pnpm db:seed                            | 19 exercises (gym/home_eq/bodyweight)                                                                |
| **Thai food seed**                | ✅ **323 rows seeded**                     | BaoWio 1,005 fetched → 323 complete rows; CC-BY-SA 4.0                                               |
| USDA food resolver                | ✅ lib/services/food-resolver.ts           | Thai DB → USDA chain; 3s timeout                                                                     |
| **MOPH 2018 seed**                | ✅ **857 foods in DB**                     | migration 0003 applied; all_foods_fixed.json in scripts/extracted/                                   |
| **System prompt**                 | ✅ **v2 live**                             | L1/L2 ED triggers; DMH 1323; deload; update_profile trigger rules                                    |
| Workout repos                     | ✅                                         | findActive, session lifecycle, bulk createMany                                                       |
| /workout/run                      | ✅ real data                               | RSC → findActive plan → create session → RunClient → saveWorkoutAction                               |
| **Inngest (6 functions)**         | ✅ **complete**                            | photo-expiry, weekly-insights (+push), plan-generator, nightly-streak, recalibration, nightly-memory |
| **PWA manifest + install prompt** | ✅ **shipped**                             | app/manifest.ts; icon 192×192; iOS/Android install prompt (after 2nd visit)                          |
| **Offline queue (Dexie)**         | ✅ **Phase 4**                             | lib/offline/db.ts + sync.ts; useSyncQueue; SyncQueueMonitor pill                                     |
| **Serwist service worker**        | ✅ **Phase 4**                             | app/sw.ts; withSerwist in next.config.ts (disabled dev)                                              |
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

1. **เทส device จริง** — install PWA (iOS/Android), ทดสอบ offline queue, push notification
2. **LINE OA setup** — กรอก `LINE_CHANNEL_SECRET` + `LINE_CHANNEL_ACCESS_TOKEN` ใน `.env.local`
3. **pgvector food search** — embedding pipeline สำหรับ semantic food search (deferred, complex)
4. `pnpm eval` (Kimi real) — เมื่อ Kimi credits กลับมา

> Inngest local dev: `npx inngest-cli@latest dev` แล้วเปิด http://localhost:8288
> SW disabled ใน dev — `pnpm build && pnpm start` เพื่อทดสอบ service worker จริง
> Unit tests: `pnpm test` → 36/36 ✓

## Critical known bugs / debt

- **workout_plans อาจว่าง** สำหรับ user เก่า — `/plan` fallback → DEFAULT_PLAN (ยอมรับได้)
- **Attachments Blob ยัง public** — Phase 3 TODO: private Blob + signed URL (1d TTL)
- **pre-migration food_logs** ไม่มี name_th — แสดง "อาหาร" (ยอมรับได้; rows ใหม่มีชื่อ)

## Architecture quick-ref

```
lib/ai/prompts/system-v2.ts          ← ACTIVE system prompt (v2+update_profile)
lib/ai/tools/shared-types.ts         ← payload types + MOOD/GOAL/ACTIVITY/EQUIPMENT labels (client-safe)
lib/ai/tools/index.ts                ← createCoachTools(userId) — 7 tools
lib/ai/tools/update_profile.ts       ← update_profile tool — reads profile+latest weight, TDEE preview
lib/db/repositories/profiles.ts      ← findByUserId, upsert, updatePlanFields
lib/db/repositories/food-logs.ts     ← listWithName (LEFT JOIN foods+attachments, COALESCE name), updateFoodLog, softDeleteOwned
lib/services/today.ts                ← loadTodaySnapshot + loadDaySnapshot(userId, dateIct) + ictDateToUtcWindow
lib/queries/keys.ts                  ← queryKeys.daySnapshot.byDate(dateIct) — date nav cache key
lib/types/dto/food-logs.ts           ← FoodLogItemDto (id, nameTh, photoUrl, ...)
app/today/actions.ts                 ← logWater/Mood/Weight + deleteFoodLog + updateFoodLog + fetchDaySnapshot
app/today/today-client.tsx           ← selectedDate state; useQuery for past days; merges dayQuery onto RSC data
components/screens/today-screen.tsx  ← FoodLogList + DateNavBar + isToday gating; height:100dvh
app/chat/chat-client.tsx             ← typing bubble; food confirm; update_profile confirm card
app/me/{page,me-client,actions}.tsx  ← RSC + client island + signOut action
tests/eval/golden/other.json         ← 20 cases incl. update_profile_001-003, safety, deload
```

## ห้าม (hard rules)

- ห้าม implement business logic จนกว่าจะมี `topics/*.md` ที่ confirm — **ตอนนี้ครบแล้ว**
- ห้าม drive-by refactor inline styles → Tailwind ในคอมมิตเดียวกับ feature
- ห้าม return raw DB row จาก API
- ห้ามเดาชื่อ column/FK — เปิดอ่าน `lib/db/schema.ts` ก่อน
- ห้าม import จาก `lib/ai/tools` ใน client components — ใช้ `lib/ai/tools/shared-types` แทน
- ห้าม send PII ไป Kimi — ใช้ user_id_hash + numeric profile เท่านั้น
- ห้ามแก้ auto-generated: `drizzle/migrations/*.sql`, `*.generated.ts`, `next-env.d.ts`
- font-family ใน inline styles ต้องใช้ `var(--font-inter), var(--font-noto-sans-thai)` เสมอ — ห้ามใช้ string ตรงๆ
