# Frontend Rules

## Tech Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · **shadcn/ui** (+ Radix primitives) · **lucide-react** icons · **recharts** charts · **vaul** bottom sheets · **sonner** toasts · **framer-motion** · **react-hook-form** + **Zod** forms · **TanStack Query** (client islands) + **Server Actions** (mutations) · **Vercel AI SDK** `useChat` · **next-pwa** + Web Push · **next-intl** (i18n, Thai default).

## Critical Rules (violation = reject)

> รายละเอียด + ตัวอย่างเต็มใน `.claude/skills/frontend-development/` และ `.claude/skills/design-system/` — **อ่านก่อนเขียน UI**

1. **Forms** → ใช้ `react-hook-form` + `zodResolver` + `<Form>` จาก `components/ui/form.tsx` (shadcn). ห้ามใช้ raw `<form onSubmit>` หรือ `useState` ทำ form state เอง.
2. **Inputs** → ใช้ `<Input>`, `<Textarea>`, `<Select>`, `<Slider>` จาก `components/ui/`. **ห้าม** `<input>`, `<select>`, `<textarea>` ดิบ.
3. **Shared components** — ห้ามทำซ้ำ:

    | Component | Import | Use for |
    | --- | --- | --- |
    | `<Form>` + `<FormField>` | `@/components/ui/form` | ทุก form |
    | `<KcalRing>` | `@/components/coach/kcal-ring` | dashboard kcal display |
    | `<MacroBar>` | `@/components/coach/macro-bar` | macro P/C/F |
    | `<ConfirmCard>` | `@/components/coach/confirm-card` | LLM tool-call confirm |
    | `<RangeBadge>` | `@/components/coach/range-badge` | "ประมาณ 450–550 kcal" |
    | `<ExplainerTooltip>` | `@/components/coach/explainer` | jargon (TDEE, โปรตีน) |
    | `<EmptyStateTeaching>` | `@/components/coach/empty-state` | no-data + next action |
    | `<RestTimer>` | `@/components/coach/rest-timer` | workout run mode |
    | `<SetLogger>` | `@/components/coach/set-logger` | reps/weight steppers |
    | `<BodyMap>` | `@/components/coach/body-map` | injury picker |
    | `<StreakFlame>` | `@/components/coach/streak-flame` | header badge |
    | `<CoachAvatar>` | `@/components/coach/avatar` | chat header |
    | `<ChatBubble>` (variants) | `@/components/chat/bubble` | text / food / workout / insight |

    _(ส่วนใหญ่ยังไม่มี — จะค่อยสร้างตาม Phase. ใช้ตารางนี้เป็น contract เวลาเพิ่มของใหม่)_

4. **Toast** → `sonner` เท่านั้น (`import { toast } from 'sonner'`). ห้าม `alert()` / custom toast component อื่น.
5. **Styling** — Tailwind utility-first + design tokens ใน `tailwind.config.ts`. ห้ามใส่ inline `style={...}` ยกเว้น dynamic values (chart sizes, animations). ห้ามตั้ง color hex ใน component — ใช้ token (`bg-primary`, `text-coach-coral`, `bg-macro-protein`).
6. **Icons** → `lucide-react` เท่านั้น. ห้าม `react-icons` / emoji แทนไอคอน.
7. **Data fetching**:
   - **Reads**: RSC + Drizzle โดยตรง (server component)
   - **Mutations**: Server Actions (`'use server'`) → invalidate via `revalidatePath` / `revalidateTag`
   - **Optimistic + offline queue**: TanStack Query + `useOptimistic` ใน client island
   - **Chat**: `useChat` จาก `ai/react` (Vercel AI SDK) — ห้าม manual `fetch` + parse SSE
   - ห้าม `useEffect + fetch` ทำ data fetching
8. **Generated / vendor** — **ห้ามแก้**: `components/ui/*` (shadcn — แก้ผ่าน CLI เท่านั้น), `next-env.d.ts`, `*.generated.ts`

## Component structure

```
components/
├── ui/             # shadcn primitives — NEVER hand-edit
├── layout/         # app chrome (TabBar, Header, Sheet wrappers)
├── coach/          # Coachly-specific reusables (KcalRing, MacroBar, ConfirmCard, ...)
├── chat/           # chat-specific (Bubble variants, Composer, MessageList)
└── pages/          # page-level pieces (one folder per route)
```

## Routes (App Router)

```
app/
├── (marketing)/welcome/page.tsx
├── (auth)/onboarding/...
├── (app)/
│   ├── chat/page.tsx           # default tab
│   ├── today/page.tsx
│   ├── plan/...
│   └── me/...
├── api/...
└── layout.tsx                  # root layout (next-intl, theme, fonts)
```

## i18n

- `next-intl` — `th` default, `en` fallback
- ห้าม hardcode Thai strings ใน component — ใช้ `t('key')` + JSON ใน `messages/th.json`
- ตัวเลข + วันที่ผ่าน `useFormatter()` (ไทย locale, น้ำหนัก kg, kcal เต็ม, มาตรา 24 ชม.)

## PWA + Offline

- `next-pwa` (Serwist) — manifest ภาษาไทย, install prompt หลัง day 2
- **Offline queue**: IndexedDB (Dexie) เก็บ pending logs + chat messages, background sync ผ่าน Workbox
- **Optimistic UI**: log ทันที + แสดง "รอซิงค์" badge ถ้ายังไม่ commit
- **Push**: Web Push (VAPID) — ใช้ได้ iOS 16.4+ เฉพาะตอนติด home screen → onboarding step สอนวิธี "เพิ่มไปหน้าจอหลัก" บน Safari iOS
- Caching strategy: stale-while-revalidate สำหรับ exercise videos, network-first สำหรับ chat

## Performance budget

- LCP < 2s บน 3G
- Route-level code split (default ของ App Router)
- Edge runtime สำหรับ chat streaming
- รูปถ่าย user upload → Vercel Blob + `next/image` + downscale 768px ก่อนส่ง Kimi vision

## Accessibility

- WCAG AA contrast, tap target ≥ 44px
- aria-label ภาษาไทยสำหรับ icon-only button
- รองรับ dynamic type + `prefers-reduced-motion`
- Haptic feedback (`navigator.vibrate`) บน workout finish / rest timer end (graceful degrade)

## Self-check before commit

- [ ] ไม่มี native `<input>`/`<select>`/`<textarea>` ใน feature code
- [ ] ทุก form ใช้ `<Form>` + `react-hook-form` + Zod
- [ ] ไม่มี `useEffect + fetch` — ใช้ RSC / Server Action / TanStack Query
- [ ] Toast จาก `sonner` ที่เดียว
- [ ] ไม่มี inline color hex — ใช้ Tailwind token
- [ ] Reuse component จากตาราง — ไม่ duplicate
- [ ] ไม่แก้ `components/ui/*` ด้วยมือ
- [ ] String UI ทุกตัวอยู่ใน `messages/*.json`
- [ ] aria-label ภาษาไทยครบ icon-only buttons
- [ ] Mobile viewport (375px) ทดสอบแล้ว

## Required reading before UI work

- `.claude/skills/design-system/SKILL.md`
- `.claude/skills/frontend-development/SKILL.md`

## Docs to update when shared code changes

| Change | Update |
| --- | --- |
| เพิ่ม/ลบ shared component | ตารางใน file นี้ + skill `frontend-development` |
| เพิ่ม custom hook | skill `frontend-development` |
| เปลี่ยน design token | skill `design-system` + `tailwind.config.ts` |
