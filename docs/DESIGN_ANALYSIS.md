# Coachly — Design Analysis

> วิเคราะห์ design handoff (Coachly.html) เพื่อแปลงเป็น Next.js 15 implementation
> Source: `/tmp/coachly-design/fit-dee/project/*` (3,681 lines, 7 screens)

## 1. Product summary

**Coachly (โค้ชดี)** — Thai-first AI personal trainer + nutrition coach, mobile PWA.
ผู้ใช้แชทกับโค้ชในภาษาไทย โค้ชใช้ tool calls บันทึกอาหาร/น้ำ/ออกกำลัง สร้างแผน 4-6 วัน/สัปดาห์ ปรับเป้าหมายอัตโนมัติทุก 14 วันตามผลจริง.

**Tone**: กันเอง (นาย/เรา) · sport modern dark · premium athletic feel
**Frame target**: Samsung Galaxy S26 Ultra (384 × 832 px viewport)

## 2. Design system

### Tokens (from `tokens.js`)

```
Surface (warm-tinted dark slate):
  bg        #0E0F12    app background
  bg2       #15171C    raised surface
  bg3       #1C1F26    card
  bg4       #262A33    input/chip
  border    #2A2E38
  borderHi  #3A3F4B

Text:
  text      #F2F3F5
  textDim   #A8ADB8
  textMute  #6B7080

Brand:
  coral     #FF6B47    primary
  coralHi   #FF8666
  coralBg   rgba(255,107,71,0.12)
  lime      #C6FF4D    accent / progress
  limeHi    #D7FF7A
  limeBg    rgba(198,255,77,0.12)

Macro (traffic light):
  protein   #FF8585    red-200
  carb      #FFCB66    amber-200
  fat       #7FB8FF    blue-200

Activity ring:
  ringMove  #FF6B47
  ringEat   #C6FF4D
  ringBurn  #7FB8FF

Semantic:
  success   #5BD68F
  warn      #FFB84D
  danger    #FF5252
```

### Typography

- **Headings + numbers** → Inter (600/700/800/900)
- **Thai body** → Noto Sans Thai (400/500/600/700/800/900)
- Numbers ใช้ `font-variant-numeric: tabular-nums` ใน timer/weight displays
- Letter spacing: ป้าย uppercase ใช้ 0.6–1.4px

### Motion

- `cdBounce` 1.2s — typing dots
- `cdPulse` 1.4s/2s — online dot, "RESTING" indicator
- `cdFadeIn` 0.2s — bottom sheets / modals
- `transform: scale(0.97)` on `:active` — tap feedback
- Stroke transitions on rings (0.6–0.8s ease)

## 3. Screens (7 total)

| ID     | Name            | Purpose                                    | Key components                                                                                              |
| ------ | --------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **A1** | Welcome         | Hero + auth choice                         | Big avatar, gradient bg, 3 CTAs (เริ่มเลย / LINE / Google)                                                  |
| **A2** | Onboarding chat | 9-turn profile setup                       | Progress bar, chat bubbles, context-sensitive input (text / chips / steppers)                               |
| **A3** | Plan preview    | Show kcal target + macros after onboarding | Big "1,820" kcal, MacroBar, "Why?" expandable                                                               |
| **B1** | Chat            | Daily AI coach interaction                 | All bubble types: text, food, workout, demo, photo, insight, weigh-in, water, typing                        |
| **C1** | Today dashboard | วันนี้ / สัปดาห์ / เดือน tabs              | TripleRing kcal, AI insight card, water/mood/weight, week bars, month heatmap, before/after                 |
| **E1** | Plan week       | Editable weekly workout                    | Week strip (จ-อา), day card, exercise list, AI swap chat (bottom sheet), exercise detail sheet (demo + log) |
| **E4** | Workout run     | Live mid-set                               | Working/Resting/Done state machine, big timer ring, reps/weight steppers, form cues                         |

### Cross-screen patterns

- **Bottom tab bar (4 items)**: แชท / วันนี้ / แผน / ฉัน — coral indicator on active
- **Bottom sheets**: drag handle (36×4 pill), 76–90% maxHeight, blur backdrop
- **CTAs**: PrimaryBtn (coral pill) for primary, GhostBtn (bg3 + border) for secondary, Chip for selection
- **Range badges**: "~450–550 kcal" — ห้ามคืนค่าแม่นจาก vision
- **Confirm cards** (Food log): Cancel / Edit / Confirm 3-way action row
- **AI insight**: bullet list with tone (warn/good/info) + "ถามโค้ชต่อ" CTA

## 4. Interactions captured in design

1. **Onboarding** — 9 sequential turns, each writes back to chat as user message + advances
2. **Food log** — coach proposes card → user confirms → green "บันทึกแล้ว" state
3. **Quick water** — `+250 / +500 / +750 ml` chips
4. **Exercise demo** — Bottom sheet with 2 tabs: วิธีเล่น (form cues) | บันทึกเซ็ต (log)
5. **AI plan swap** — Bottom sheet chat → coach proposes new day → "ตกลง ปรับเลย" mutates plan state
6. **Workout run** — Working → Resting timer → next set, with `+15s` / Skip controls
7. **Today tabs** — 3 ranges (today/week/month) each with own AI insight + visualizations

## 5. Implementation plan

### Stack mapping (per `CLAUDE.md`)

| Design medium                             | Production target                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| HTML/CSS/JS prototype with inline styles  | Next.js 15 App Router + TS + Tailwind + shadcn/ui                                     |
| `tokens.js` global object                 | `lib/design/tokens.ts` + `tailwind.config.ts` extension                               |
| `S26Frame` device frame                   | Render unframed in production routes, framed only on `/canvas` design preview         |
| In-memory React state                     | Server Actions + Drizzle (writes), RSC + Drizzle (reads), TanStack Query (optimistic) |
| Mock data inline (DEFAULT_PLAN, RUN_PLAN) | Seed scripts + DB tables                                                              |

### Phasing

**Phase 0 (this commit)** — Static design port

1. Scaffold Next.js + TS + Tailwind + Drizzle
2. Port tokens to Tailwind config + CSS vars
3. Port all components (CoachAvatar, KcalRing, MacroBar, RangeBadge, BottomTabBar, etc.)
4. Port all 7 screens as static routes (no DB writes yet — use mock data)
5. Build Drizzle schema (matches DB plan in `DB_SCHEMA.md`)
6. Generate first migration

**Phase 1 (next)** — Wire backend

- Auth.js v5 (LINE + Google)
- Replace mock data with Drizzle queries (RSC for reads)
- Server Actions for mutations (water log, weight log, mood, workout completion)

**Phase 2** — AI tool layer

- Kimi K2.6 client (`lib/ai/kimi.ts`)
- Tool definitions (`lib/ai/tools/*`): `log_food`, `log_water`, `log_exercise`, `update_plan`, `weigh_in`, `set_mood`
- Streaming chat via `useChat` from Vercel AI SDK
- LLM tracing in-DB via `messages` table (Helicone/Langfuse deferred)

**Phase 3** — Background jobs

- Inngest weekly insight generation
- Plan recalibration every 14 days
- Photo expiry (signed URL refresh)

**Phase 4** — PWA + offline

- next-pwa manifest, install prompt
- IndexedDB queue for offline logs
- Web Push (VAPID) for daily nudges

## 6. Open questions / risks

- **Coach avatar** — design uses neutral flat illustration (lime headband). Need to confirm whether to ship as-is or commission a real illustrator before launch.
- **Exercise videos** — design uses placeholder play buttons. Need a content pipeline (record/license) before E1/E4 can be useful.
- **Photo analysis bounding boxes** — design shows fake bbox; real Kimi vision returns text + JSON, no bbox. Either: (a) ditch bbox UI, (b) build a separate detection step before vision describe.
- **AI swap quick suggestions** — currently hardcoded ("อยากเล่นไหล่แทน" etc.). Should generate dynamically from current day's plan in production.
- **Streak counter** — design shows "🔥 12 วัน" everywhere. Definition needs locking: streak = consecutive days with ANY logged event? With workout? With kcal-in-range? See `topics/progressive-overload.md` to confirm.
- **Onboarding step 4 estimate** — UI shows "~N สัปดาห์" calculation `Math.max(2, Math.ceil(Math.abs(weight - target) * 2))`. This is a rough mock — real estimate must come from goal-aware deficit/surplus calc per `topics/tdee-and-macros.md`.

## 7. What we're NOT building in Phase 0

- "ฉัน" (Me) tab — design doesn't include it
- Auth screens beyond welcome (LINE/Google buttons are placeholders, no callback handling yet)
- Real AI chat (chat screen uses static mock messages)
- Camera capture (photo bubble shows placeholder)
- Push notifications
