# Coachly · Session Handoff

> อ่านไฟล์นี้เป็นอันดับแรกในทุก session ใหม่
> Last updated: 2026-05-01 · Branch: `claude/build-coachly-coach-ZBpRx`
> Last commit: blocker #1 closed (lockfile + eslint flat config + smoke tests pass)

## TL;DR — เปิด session ใหม่ทำตามนี้

```bash
# 1. ดึง branch ล่าสุด
git checkout claude/build-coachly-coach-ZBpRx
git pull origin claude/build-coachly-coach-ZBpRx

# 2. อ่านสามไฟล์นี้ตามลำดับ (15 นาที)
#    CLAUDE.md                         project guide + rules
#    docs/HANDOFF.md (this file)       state + next-actions
#    docs/DESIGN_ANALYSIS.md           design contract
#    docs/DB_SCHEMA.md                 schema rationale
#    .claude/rules/working-principles.md, backend.md, frontend.md

# 3. รัน checks ก่อนแก้
pnpm install                          # ครั้งแรก
pnpm typecheck && pnpm lint           # ต้องผ่านก่อนเริ่ม
pnpm dev                              # http://localhost:3000
```

## Where we are — status snapshot (Phase 0 complete)

| Area                                | Status                                       | Notes                                                                 |
| ----------------------------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| Project guide (CLAUDE.md)           | ✅ committed                                 | rules + topics referenced                                             |
| Rule docs (.claude/rules/)          | ✅ working-principles + backend + frontend   | `types.md` + `git-workflow.md` ยังไม่มี — สร้างเมื่อจำเป็น            |
| Topic docs (.claude/topics/)        | ❌ ทุกอันยังว่าง                             | ต้อง interview เจ้าของ — ดู "Domain knowledge — DO NOT GUESS"         |
| Skills (.claude/skills/)            | ❌ ว่าง                                      | จะสร้างใน Step 4                                                      |
| Design analysis                     | ✅ docs/DESIGN_ANALYSIS.md                   | 7 screens, tokens, interactions, open questions                       |
| DB schema plan                      | ✅ docs/DB_SCHEMA.md                         | 19 tables ออกแบบครบ                                                   |
| Drizzle schema file                 | ✅ lib/db/schema.ts                          | ตาม DB_SCHEMA.md; migration `0000_extensions` + `0001_init` generated |
| Next.js scaffold                    | ✅ ทุก config + globals.css                  | `pnpm-lock.yaml` committed; smoke (typecheck/lint/build) ผ่าน         |
| Design tokens                       | ✅ lib/design/tokens.ts + tailwind.config.ts | parity กับ design `tokens.js`                                         |
| Shared components                   | ✅ components/coach/_ + components/chat/_    | 1:1 port จาก handoff                                                  |
| 7 screens (A1–E4)                   | ✅ components/screens/_ + app/_/page.tsx     | static — ไม่มี DB write                                               |
| Tab-bar navigation                  | ✅ wired                                     | /chat ↔ /today ↔ /plan ↔ /me (placeholder); typedRoutes strict ON     |
| Canvas review page                  | ✅ /canvas                                   | ทุก S26 frame เรียง                                                   |
| TanStack Query provider             | ✅ app/providers.tsx + .prettierrc           | staleTime 30s, offlineFirst; client islands ห้าม `fetch` ดิบ          |
| DB client (Drizzle/Neon HTTP)       | ✅ lib/db/client.ts                          | edge-compatible; pool client เพิ่มใน Phase 2 พร้อม chat streaming     |
| Users repository + types            | ✅ lib/db/repositories/users.ts + types/db   | findById/byLineSub/byGoogleSub + create + softDelete                  |
| Query key factory                   | ✅ lib/queries/keys.ts                       | central registry; กฎใหม่ใน rules/frontend.md ห้าม inline queryKey     |
| Topics (TDEE / streak)              | ✅ .claude/topics/\*.md                      | owner-confirmed; AI ห้ามเดาเกินจากนี้                                 |
| Services (TDEE + streak)            | ✅ lib/services/{tdee,streak}.ts             | pure, 33 vitest cases pass                                            |
| Auth.js v5 (LINE + Google)          | ✅ lib/auth.ts + middleware + welcome wired  | JWT session, signIn callback resolves/creates users row; routes guard |
| Profiles repo + DTO + service       | ✅ lib/services/onboarding.ts + Zod          | upsert pattern; Mifflin/Katch switch; macro scaler                    |
| Onboarding flow end-to-end          | ✅ /onboarding RSC + action + UI wired       | 9-turn → DB → /plan-preview (real targets) → /today                   |
| Plan-preview real data              | ✅ RSC reads user_profiles                   | dynamic explainer copy per goal; redirects mid-onboarding users       |
| Logs repos (food/water/mood/weight) | ✅ lib/db/repositories/\*-logs.ts            | sumInRange, latest, createPending/Confirmed                           |
| Logs server actions                 | ✅ app/today/actions.ts                      | logWater/logMood/logWeight; auth + Zod + revalidatePath               |
| /today RSC (read side)              | ✅ loadTodaySnapshot + TodayClient           | header + kcal ring real; water/mood/weight click still optimistic     |

## What's NOT done (เรียงตาม priority)

### ✅ Blockers Phase 0 — เสร็จแล้ว

1. **`pnpm install` + smoke test** — ✅ done
   - `pnpm-lock.yaml` committed
   - `eslint.config.mjs` (flat config, extends `next/core-web-vitals`) committed
   - `next.config.ts`: ปิด `typedRoutes` ชั่วคราว (ต้องเปิดใหม่ใน Phase 1 พร้อมสร้าง `/me` page)
   - แก้ `react/no-unescaped-entities` 4 จุดใน `plan-screen.tsx:624`
   - `pnpm typecheck` / `pnpm lint` / `pnpm build` ✅ ทั้งหมด exit 0
   - Build รวม 9 routes static (8 หน้าจอ + not-found)
   - คงเหลือ warning: `@next/next/no-page-custom-font` ใน layout.tsx — แก้ตอน refactor ไป `next/font/google` ใน Phase 1

2. **Drizzle initial migration** — ✅ done
   - `drizzle/migrations/0000_extensions.sql` (custom) — `CREATE EXTENSION pgcrypto / citext / vector` (ตามลำดับ)
   - `drizzle/migrations/0001_init.sql` (auto-generated, ห้ามแก้) — 20 tables, 22 FKs, 18 indexes รวม partial unique บน `workout_plans`
   - `_journal.json` ลำดับถูกต้อง: `0000_extensions` → `0001_init`
   - Schema source-of-truth: `lib/db/schema.ts` (citext + vector(768) ใช้ผ่าน `customType`)

3. **Apply migration ลง Neon dev branch** — ✅ done
   - `dotenv-cli` ติดตั้ง + scripts `db:*` + `eval` prefix `dotenv -e .env.local --` แล้ว
   - `pnpm db:migrate` apply สำเร็จ → 3 extensions, 20 tables, 22 FKs, 43 indexes
   - Verify: `users.email` = `citext`, `foods.embedding` = `vector` ✅
   - ⚠️ DB credentials อยู่ใน `.env.local` (gitignored) — owner ควร rotate password ใน Neon dashboard หลัง dev session เพราะ paste อยู่ใน chat log

4. **`/me` placeholder + เปิด `typedRoutes: true`** — ✅ done
   - `app/me/page.tsx` placeholder (👤 + "หน้าโปรไฟล์ + ตั้งค่า กำลังจะมาเร็วๆ นี้")
   - Reuse `BottomTabBar` กับ TabBar คงทำงานครบ 4 tabs
   - `next.config.ts`: `typedRoutes: true` กลับมา (Next 15 stable, ย้ายออกจาก `experimental`)
   - Build รวม 10 static routes (เพิ่ม `/me` 714 B)
   - Phase 1 จะใส่ profile/account screen จริง

### 🔴 Blocker / next session ต้องทำ

_Phase 0 ปิดครบ → ก้าวเข้า Phase 1_

ลำดับแนะนำสำหรับ Phase 1:

1. **`lib/db/client.ts`** — Neon HTTP/pool client + `getDb()` helper
2. **`lib/types/db/*.ts`** — `InferSelectModel` exports per aggregate
3. **`lib/db/repositories/users.ts`** — แรกสุด เพราะทุก service ต้อง resolve user
4. **Auth.js v5** — `lib/auth.ts` + LINE/Google providers + `app/api/auth/[...nextauth]/route.ts`
5. **`topics/tdee-and-macros.md`** + **`topics/streak.md`** — interview owner ก่อน implement service

### 🟠 Phase 1 — wire backend (1-2 sprints)

3. **Auth.js v5 setup** — LINE Login + Google
   - `lib/auth.ts` — Auth.js config
   - `app/api/auth/[...nextauth]/route.ts`
   - LINE provider + Google provider env vars (`.env.example` มี placeholders แล้ว)
   - middleware.ts redirect unauthed → `/`
4. **Repositories layer** (`lib/db/repositories/`)
   - `users.ts`, `profiles.ts`, `food-logs.ts`, `water-logs.ts`, `mood-logs.ts`, `weight-logs.ts`, `workout-plans.ts`, `workout-sessions.ts`, `chat.ts`, `daily-summaries.ts`, `goals.ts`
   - 1 file per aggregate (rules/backend.md)
5. **Services layer** (`lib/services/`)
   - `tdee.ts` — TDEE + macro calculator (รอ topics/tdee-and-macros.md)
   - `plan-generator.ts` — สร้าง weekly plan ตาม goal + equipment + days/wk
   - `recalibration.ts` — 14-day plan adjust
   - `streak.ts` — definition pending (ดู open questions)
6. **Replace mock data → Drizzle queries**
   - `app/today/page.tsx` → RSC ดึงจาก `daily-summaries`
   - `app/plan/page.tsx` → RSC ดึง `workout_plans` ของ user
   - `app/chat/page.tsx` → RSC ดึง `messages` (last 20)
7. **Server Actions for mutations**
   - `logWaterAction`, `logMoodAction`, `logWeightAction`, `confirmFoodLogAction`, `completeSetAction`
   - Zod input validation, `auth()` ภายใน — **ห้ามรับ `userId` จาก request body**
   - `revalidatePath('/today')` หลังเขียน

### 🟡 Phase 2 — AI tool layer

8. **Kimi K2.6 client** — `lib/ai/kimi.ts`
   - OpenAI-compatible client → `https://api.moonshot.ai/v1` (global endpoint, not .cn)
   - Log every call into `messages` table (`kimi_request_id`, `token_in`, `token_out`, `latency_ms`) — external tracing (Helicone/Langfuse) deferred
   - System prompt builder (ใช้ memory blocks: profile + summary_7d + last-20)
9. **Tool definitions** — `lib/ai/tools/*.ts` (one file per tool)
   - `search_food`, `log_food`, `log_water`, `log_exercise`, `update_plan`, `weigh_in`, `set_mood`, `update_profile`
   - ทุก tool: Zod schema (enum tight) + return `{ confirmCard: ... }` ก่อน commit
   - golden test ใน `tests/eval/<tool>.test.ts`
10. **Streaming chat** — `app/api/chat/route.ts`
    - Vercel AI SDK + `useChat` ใน client
    - Edge runtime
    - Rate limit ผ่าน Upstash Redis (per user_id, sliding window)
11. **Eval harness** — `tests/eval/run.ts` + `tests/eval/golden/*.json`
    - 50 Thai food prompts (รออาหารจริงจากเจ้าของ)
    - regression check ก่อน merge ทุก system-prompt change

### 🟢 Phase 3 — background jobs (Inngest)

12. **Weekly insight generator** — `inngest/functions/weekly-insights.ts`
    - cron Sunday 23:00 ICT
    - ดึง 7-day summary → generate `ai_insights` row
13. **Plan recalibration** — every 14 days check weight trend → adjust kcal target
14. **Photo expiry** — Vercel Blob signed URL refresh + cleanup `attachments WHERE expires_at < now()`

### 🟢 Phase 4 — PWA + offline

15. **next-pwa setup** — manifest.json (Thai), service worker
16. **Offline queue** — Dexie (IndexedDB) สำหรับ pending logs + chat messages
17. **Web Push** — VAPID, daily nudges (ต้องมี iOS 16.4+ install-to-home-screen onboarding step)

## Critical conventions (อ่านก่อนเขียน code)

- **Type rules** (rules/types.md จะสร้างทีหลัง — ใช้ตามนี้ก่อน):
  - `lib/types/db/*.ts` — DB row shape (จาก `InferSelectModel<typeof table>`)
  - `lib/types/dto/*.ts` — API/UI shape (Zod schemas)
  - **ห้าม return raw DB row ออก API** — แปลง dto ก่อน
- **Backend layering** (rules/backend.md):
  - Route handler: parse + auth + call service + format
  - Service: business rules
  - Repository: Drizzle queries
  - AI tool handler: wrap service into LLM-callable
  - **ห้าม inline DB queries ใน route handler**
- **Frontend** (rules/frontend.md):
  - Forms ต้อง react-hook-form + zodResolver + `<Form>` shadcn (ตอนนี้ยังไม่ได้ลง shadcn — Phase 1 task)
  - Toast = sonner เท่านั้น (ห้าม alert)
  - Icons = lucide-react เท่านั้น (ตอนนี้หน้า design ใช้ inline SVG — ค่อย refactor ไป lucide ทีหลัง)
- **Design fidelity**:
  - หน้าจอทั้ง 7 ใช้ inline styles ตรงตาม design handoff (1:1 port)
  - Phase 1+ refactor ไป Tailwind + shadcn ค่อยเป็นค่อยไป — **อย่าทำในคอมมิตเดียวกับ feature work**
  - Visual output ห้ามเปลี่ยน — ต้อง match `Coachly.html` พิกเซล

## Domain knowledge — DO NOT GUESS (interview owner first)

ทุกหัวข้อต้อง verify กับ **เจ้าของผลิตภัณฑ์** ก่อน implement:

| Topic                      | File (ยังว่าง)                           | ใช้ที่ไหน                                                              | Owner question                                                                            |
| -------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| TDEE formula + adjustments | `.claude/topics/tdee-and-macros.md`      | `lib/services/tdee.ts`, A3 plan preview, A2 onboarding step 4 estimate | ใช้ Mifflin-St Jeor หรือ Katch-McArdle? % deficit/surplus per goal? Macro split per goal? |
| kcal floors + ED triggers  | `.claude/topics/safety-floors.md`        | system prompt + tool guards                                            | Floor < 1200 F / 1500 M? Trigger keywords? Escalation flow → DMH 1323?                    |
| PDPA consent               | `.claude/topics/pdpa.md`                 | `users.consents`, retention                                            | Consent versions? Photo retention? Account-delete flow?                                   |
| Food DB precedence         | `.claude/topics/food-db.md`              | `lib/services/food-resolver.ts`, `foods.source`                        | Order: user_edit > vision_cache > USDA > Thai DB > LLM?                                   |
| Progressive overload       | `.claude/topics/progressive-overload.md` | `lib/services/recalibration.ts`, E1 plan suggestions                   | กฎเพิ่มน้ำหนัก/reps? Deload schedule?                                                     |
| Streak definition          | TBD (โผล่ใน design ทุกที่ "🔥 12 วัน")   | `lib/services/streak.ts`                                               | นิยามคืออะไร? Any-log? Workout? Kcal-in-range? Reset rule?                                |

ใช้ command `/fill-topics <slug>` (ยังไม่ได้สร้างจริง — ต้องเป็น slash command ใน `.claude/commands/`) เพื่อสัมภาษณ์.

## Open questions from design (mirror of DESIGN_ANALYSIS.md §6)

1. **Coach avatar** — neutral flat illustration ตอนนี้ (lime headband). ใช้ shipping จริง หรือจ้าง illustrator?
2. **Exercise videos** — placeholder play buttons. ต้องมี content pipeline (record/license) ก่อน E1/E4 useful จริง
3. **Photo bbox** — design มี fake bounding box. Kimi vision คืน text/json ไม่มี bbox → ต้อง (a) ตัด bbox UI ทิ้ง หรือ (b) เพิ่ม detection step ก่อน vision describe
4. **AI swap quick suggestions** — hardcoded ("อยากเล่นไหล่แทน") → ต้อง generate dynamic จาก current day plan
5. **Onboarding step 4 estimate** — `Math.ceil(|w - target| * 2)` สัปดาห์ — แค่ mock. ต้องคำนวณจาก deficit/surplus ตาม `topics/tdee-and-macros.md`

## Tech debt / known issues

- **Inline styles ทุกหน้าจอ** — visual fidelity ก่อน, refactor ไป Tailwind utility + shadcn ทีหลัง
- **Hardcoded Thai strings ใน screens** — ต้อง extract → `messages/th.json` (next-intl) ใน Phase 1
- **No i18n setup** — `<html lang="th">` แค่ static ใน `app/layout.tsx`
- **No tests** — vitest config ยังไม่มี, eval harness ยังไม่มี
- **No lockfile** — `pnpm-lock.yaml` ยังไม่ถูก generate (รัน `pnpm install` ครั้งแรก)
- **No Auth wired** — LINE/Google buttons ใน Welcome screen ยัง dead
- **No real DB connection** — `lib/db/client.ts` ยังไม่ได้สร้าง; schema ยังไม่ migrate
- **Photo placeholder** — ทั้ง chat photo bubble และ exercise demo ใช้ gradient/dotted bg (เพราะไม่มีของจริง)
- **dangerouslySetInnerHTML ใน TodayScreen** — ใช้กับ AI insight bullet ที่มี `<b>` — Phase 1 ต้อง sanitize หรือเปลี่ยนเป็น structured data

## File map (เรื่องสำคัญ)

```
fit-dee/
├── CLAUDE.md                          ← project guide
├── .claude/
│   ├── rules/working-principles.md    ← cross-cutting
│   ├── rules/backend.md               ← layering, schema, LLM tools
│   ├── rules/frontend.md              ← critical UI rules
│   ├── topics/                        ← ⚠️ ว่างหมด ต้อง interview
│   ├── skills/                        ← ⚠️ ว่าง
│   └── commands/                      ← ⚠️ ว่าง
├── docs/
│   ├── HANDOFF.md                     ← (this file)
│   ├── DESIGN_ANALYSIS.md             ← design contract
│   └── DB_SCHEMA.md                   ← schema plan
├── app/
│   ├── layout.tsx                     ← fonts + metadata
│   ├── globals.css                    ← Tailwind + cd* keyframes
│   ├── page.tsx                       ← A1 Welcome
│   ├── onboarding/page.tsx            ← A2
│   ├── plan-preview/page.tsx          ← A3
│   ├── today/page.tsx                 ← C1 (default tab)
│   ├── chat/page.tsx                  ← B1
│   ├── plan/page.tsx                  ← E1
│   ├── workout/run/page.tsx           ← E4
│   └── canvas/page.tsx                ← all 7 screens for review
├── components/
│   ├── coach/primitives.tsx           ← CoachAvatar, KcalRing, MacroBar, RangeBadge, BottomTabBar, PrimaryBtn, GhostBtn, Chip, ProgressBar, StreakFlame
│   ├── coach/s26-frame.tsx            ← device frame (canvas only)
│   ├── chat/bubbles.tsx               ← all bubble types
│   └── screens/*.tsx                  ← 1 per screen
├── lib/
│   ├── design/tokens.ts               ← single source of truth for hex
│   └── db/schema.ts                   ← Drizzle schema
├── tailwind.config.ts                 ← design tokens → utilities
├── drizzle.config.ts
├── package.json                       ← scripts: dev, build, db:*, eval, ...
└── .env.example
```

## Git state

- Branch: `claude/build-coachly-coach-ZBpRx` (pushed to GitHub)
- Commits:
  - `4a87f5a` — chore: scaffold Coachly project guide and rule docs
  - `79de014` — feat(coachly): port design handoff to Next.js scaffold + plan DB schema
- Remote (production): `https://github.com/jetsadaton/fit-dee.git`
- Remote (sandbox proxy): blocked HTTP 403 — push ตรง github ผ่าน PAT (token ใช้ครั้งเดียวแล้วต้อง revoke — ดู previous session)
- **No PR opened yet** — เปิด PR เมื่อ Phase 0 ผ่าน CI

## Quick prompts for next session

> "อ่าน docs/HANDOFF.md แล้วเริ่ม blocker #1 (pnpm install + smoke test) ให้หน่อย"

> "อ่าน docs/HANDOFF.md + .claude/topics/tdee-and-macros.md (ที่เพิ่ง fill มา) แล้ว implement lib/services/tdee.ts ตาม phase 1 #5"

> "อ่าน docs/HANDOFF.md แล้ว start phase 2 #8 — Kimi client + first 2 tools (search_food + log_food) พร้อม golden tests"

## ห้าม

- ห้ามเริ่ม implement business logic จนกว่าจะมี `topics/*.md` ที่ตรงกัน
- ห้าม drive-by refactor inline styles → Tailwind ในคอมมิตเดียวกับ feature
- ห้าม return raw DB row จาก API
- ห้ามเดาชื่อ column / FK — เปิดอ่าน `lib/db/schema.ts` ก่อน
- ห้าม inline tool name ใน LLM call — ต้องอ้าง `lib/ai/tools/*` ที่มีอยู่จริง
- ห้าม send PII (email, real name, phone) ไป Kimi — ใช้ user_id_hash + numeric profile เท่านั้น
- ห้ามแก้ auto-generated: `drizzle/migrations/*.sql`, `*.generated.ts`, `next-env.d.ts`
