# CLAUDE.md (Coachly / fit-dee)

> Root project guide — เก็บสั้น รายละเอียดอยู่ใน `.claude/rules/*.md` และ skills.

## At a glance

**Coachly (โค้ชดี)** — Thai-first AI personal trainer + nutrition coach, chat-driven, mobile PWA สำหรับมือใหม่ที่ไม่มีพื้นฐานออกกำลังกาย/โภชนาการ. Stack: **Next.js 15 (App Router) + TypeScript + Drizzle + Neon Postgres + Vercel + Kimi K2.6** (multimodal, OpenAI-compatible). Auth: LINE + Google via Auth.js v5. UI: shadcn/ui + Tailwind + LINE Seed Sans Thai. Bg jobs: Inngest. LLM tracing: Helicone.

Architecture: feature-folder ใน `app/` + RSC สำหรับ read, Route Handlers สำหรับ write/streaming, service layer + repository pattern สำหรับ data access. Shared types ใน `lib/types/` แยก `db/` (DB row) จาก `dto/` (API/UI).

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | start Next.js dev server (http://localhost:3000) |
| `pnpm build` | production build |
| `pnpm start` | run production server |
| `pnpm test` | run vitest unit tests |
| `pnpm test:e2e` | run Playwright e2e |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier write |
| `pnpm db:generate` | drizzle-kit generate migrations จาก schema |
| `pnpm db:migrate` | apply migrations to Neon |
| `pnpm db:studio` | drizzle-kit studio (DB GUI) |
| `pnpm eval` | run LLM tool-call eval harness |

> Note: scripts ยังไม่ถูก scaffold — จะถูกสร้างใน Phase 0 setup.

## Rules — read before coding

@.claude/rules/working-principles.md
@.claude/rules/backend.md
@.claude/rules/frontend.md
@.claude/rules/types.md
@.claude/rules/git-workflow.md

## Skills (`.claude/skills/`)

| Skill | Use when |
| --- | --- |
| _(จะเพิ่มใน Step 4)_ | |

## Domain knowledge — DO NOT GUESS

หัวข้อใน `.claude/topics/*.md` ห้าม AI เดาเอง ต้อง verify กับเจ้าของผลิตภัณฑ์:

- `tdee-and-macros.md` — สูตร TDEE, deficit/surplus %, macro split per goal
- `safety-floors.md` — kcal floors, disordered-eating triggers, escalation flow (DMH 1323)
- `pdpa.md` — consent versions, retention policy, image expiry
- `food-db.md` — precedence (user-edit > vision-cache > USDA > Thai DB > LLM)
- `progressive-overload.md` — กฎเพิ่มน้ำหนัก/reps, deload schedule

ใช้ `/fill-topics <slug>` เพื่อสัมภาษณ์เจ้าของและเติมรายละเอียด

## Onboarding

Long-form walkthrough: [`docs/onboarding.md`](docs/onboarding.md)

## Language policy

| Artifact | Language |
| --- | --- |
| Code, identifiers, file names | English |
| Commit subject + PR title | English (Conventional Commits) |
| Commit body | mixed OK (English หลัก, ไทยเสริมได้) |
| **PR body, CHANGELOG, review summary** | **ภาษาไทย** |
| User-facing UI strings | ภาษาไทย (default), EN fallback |
| Tool output (compiler/linter/test) | ห้ามแปล — ดิบเสมอ |

## Safety / Compliance

- **PDPA Thailand** — health data ต้องมี explicit consent + retention policy ชัด (ดู `.claude/topics/pdpa.md`)
- **Medical disclaimer** — Coachly ไม่ใช่หมอ. กรณี eating disorder / medical condition ให้แนะนำผู้เชี่ยวชาญ + DMH 1323
- **kcal floors** — ห้ามแนะนำ <1200 F / <1500 M โดยไม่ flag
