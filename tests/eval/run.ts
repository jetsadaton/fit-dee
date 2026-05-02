#!/usr/bin/env tsx
// Eval harness — tests Kimi's tool-calling behaviour against golden cases.
//
// Usage: pnpm eval [--filter <pattern>]
//   pnpm eval                   → run all cases
//   pnpm eval --filter food     → run cases whose id starts with "food"
//
// Tool execute functions are no-ops (no DB writes) — we only verify
// which tools Kimi calls and with what arguments.
//
// Exit code 0 = all pass, 1 = any failure.

import { generateText, stepCountIs, tool } from 'ai';
import { z } from 'zod';
import { kimi, DEFAULT_MODEL } from '@/lib/ai/kimi';
import { buildSystemPrompt } from '@/lib/ai/prompts/system-v1';
import type { MemoryContext } from '@/lib/ai/memory';
import type { GoldenCase, EvalResult } from './types';

import foodCases from './golden/food.json';
import otherCases from './golden/other.json';

// ── Stub tools (same inputSchema, no DB writes) ────────────────────────────

function createEvalTools() {
  return {
    search_food: tool({
      description: 'ค้นหาอาหารจากชื่อภาษาไทยหรืออังกฤษ',
      inputSchema: z.object({ query: z.string() }),
      execute: async () => [],
    }),
    log_food: tool({
      description: 'บันทึกมื้ออาหาร',
      inputSchema: z.object({
        foodId: z.string().uuid().optional(),
        nameTh: z.string(),
        mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
        portionG: z.number().int().positive().optional(),
        kcalLow: z.number().int().positive(),
        kcalHigh: z.number().int().positive(),
        proteinG: z.number().min(0),
        carbG: z.number().min(0),
        fatG: z.number().min(0),
      }),
      execute: async (args) => ({
        type: 'food_log_confirm',
        pendingId: 'eval-stub',
        ...args,
        kcal: Math.round((args.kcalLow + args.kcalHigh) / 2),
        portionG: args.portionG ?? null,
      }),
    }),
    log_water: tool({
      description: 'บันทึกการดื่มน้ำ',
      inputSchema: z.object({ ml: z.number().int().min(50).max(5000) }),
      execute: async (args) => ({ type: 'water_log_done', ...args, loggedAt: new Date().toISOString() }),
    }),
    weigh_in: tool({
      description: 'บันทึกน้ำหนักตัว',
      inputSchema: z.object({
        weightKg: z.number().min(20).max(400),
        bodyFatPct: z.number().min(3).max(60).optional(),
      }),
      execute: async (args) => ({
        type: 'weigh_in_done',
        ...args,
        bodyFatPct: args.bodyFatPct ?? null,
        loggedAt: new Date().toISOString(),
      }),
    }),
    set_mood: tool({
      description: 'บันทึกระดับพลังงาน',
      inputSchema: z.object({
        energy: z.number().int().min(1).max(5),
        note: z.string().max(500).optional(),
      }),
      execute: async (args) => ({
        type: 'mood_log_done',
        ...args,
        note: args.note ?? null,
        loggedAt: new Date().toISOString(),
      }),
    }),
  };
}

// ── Stub memory context ────────────────────────────────────────────────────

const STUB_MEMORY: MemoryContext = {
  profileBlock:
    'เพศ: ชาย · อายุ 28 · 175cm · 70kg · เป้า: รักษาฟิต · TDEE 2100 kcal · เป้า 1900 kcal · โปรตีน 140g · คาร์บ 200g · ไขมัน 60g · ออก 3 วัน/สัปดาห์ · อุปกรณ์: ฟิตเนส',
  summary7d: '',
  notes: '',
};

// ── Runner ─────────────────────────────────────────────────────────────────

function isSubset(actual: Record<string, unknown>, expected: Record<string, unknown>): boolean {
  for (const [k, v] of Object.entries(expected)) {
    if (actual[k] !== v) return false;
  }
  return true;
}

async function runCase(gc: GoldenCase): Promise<EvalResult> {
  const start = Date.now();
  const failures: string[] = [];
  const toolsCalledActual: string[] = [];

  try {
    const systemPrompt = buildSystemPrompt(STUB_MEMORY);
    const result = await generateText({
      model: kimi(DEFAULT_MODEL),
      system: systemPrompt,
      messages: [{ role: 'user', content: gc.userMessage }],
      tools: createEvalTools(),
      stopWhen: stepCountIs(6),
      temperature: 1,
      providerOptions: { kimi: { thinking: { type: 'enabled' } } },
    });

    // Collect all tool calls across all steps
    for (const step of result.steps) {
      for (const tc of step.toolCalls) {
        toolsCalledActual.push(tc.toolName);
      }
    }

    // Check tools called
    const expectedTools = gc.expect.toolsCalled;
    for (const expected of expectedTools) {
      if (!toolsCalledActual.includes(expected)) {
        failures.push(`expected tool "${expected}" to be called, got: [${toolsCalledActual.join(', ')}]`);
      }
    }

    // Check no unexpected tools when empty expected
    if (expectedTools.length === 0 && toolsCalledActual.length > 0) {
      failures.push(`expected NO tools, but called: [${toolsCalledActual.join(', ')}]`);
    }

    // Check min steps
    if (gc.expect.minSteps && result.steps.length < gc.expect.minSteps) {
      failures.push(`expected ≥ ${gc.expect.minSteps} steps, got ${result.steps.length}`);
    }

    // Check tool argument assertions
    if (gc.expect.toolArgs) {
      for (const [toolName, expectedArgs] of Object.entries(gc.expect.toolArgs)) {
        for (const step of result.steps) {
          for (const tc of step.toolCalls) {
            if (tc.toolName === toolName) {
              const actual = (tc as unknown as { input: Record<string, unknown> }).input;
              if (!isSubset(actual, expectedArgs)) {
                failures.push(
                  `${toolName} args mismatch: expected ${JSON.stringify(expectedArgs)}, got ${JSON.stringify(actual)}`,
                );
              }
            }
          }
        }
      }
    }
  } catch (err) {
    failures.push(`threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    case: gc,
    pass: failures.length === 0,
    failures,
    toolsCalledActual,
    durationMs: Date.now() - start,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const filterArg = process.argv.indexOf('--filter');
  const filterPattern = filterArg !== -1 ? process.argv[filterArg + 1] : null;

  const allCases = [...(foodCases as GoldenCase[]), ...(otherCases as GoldenCase[])];
  const cases = filterPattern ? allCases.filter((c) => c.id.startsWith(filterPattern)) : allCases;

  console.log(`\n🧪 Eval harness — ${cases.length} cases${filterPattern ? ` (filter: "${filterPattern}")` : ''}\n`);

  let passed = 0;
  let failed = 0;

  for (const gc of cases) {
    process.stdout.write(`  ${gc.id.padEnd(14)} ${gc.description.slice(0, 50).padEnd(52)}`);
    const result = await runCase(gc);
    if (result.pass) {
      passed++;
      console.log(`✓  [${result.durationMs}ms] tools=[${result.toolsCalledActual.join(',')}]`);
    } else {
      failed++;
      console.log(`✗`);
      for (const f of result.failures) {
        console.log(`               ↳ ${f}`);
      }
    }
  }

  console.log(`\n${passed}/${cases.length} passed${failed > 0 ? `, ${failed} failed` : ''}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
