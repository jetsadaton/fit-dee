#!/usr/bin/env tsx
// Eval harness via Claude CLI — same golden cases as run.ts but uses
// `claude -p --model haiku` instead of Kimi (cheaper while Kimi credits depleted).
//
// ⚠️  CAVEAT: นี่คือ "simulation eval" — Claude ทำนายว่า Kimi *จะ* call tools อะไร
// ไม่ใช่ Kimi เรียก tools จริง pass rate ที่ได้บอกว่า prompt เข้าใจได้ ไม่ใช่ Kimi behaviour
// เมื่อ Kimi credits กลับมา ให้รัน `pnpm eval` (run.ts) เพื่อผลจริง
//
// Usage: pnpm eval:claude [--filter food] [--limit 10]

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const CONCURRENCY = 5;
import { buildSystemPrompt } from '@/lib/ai/prompts/system-v2';
import type { MemoryContext } from '@/lib/ai/memory';
import type { GoldenCase, EvalResult } from './types';

import foodCases from './golden/food.json';
import otherCases from './golden/other.json';

const STUB_MEMORY: MemoryContext = {
  profileBlock:
    'เพศ: ชาย · อายุ 28 · 175cm · 70kg · เป้า: รักษาฟิต · TDEE 2100 kcal · เป้า 1900 kcal · โปรตีน 140g · คาร์บ 200g · ไขมัน 60g · ออก 3 วัน/สัปดาห์ · อุปกรณ์: ฟิตเนส',
  summary7d: '',
  notes: '',
};

const TOOL_DEFS = `AVAILABLE_TOOLS:
- search_food(query: string): ค้นหาอาหารใน DB คืน foods ที่ match
- log_food({foodId?, nameTh, mealType: 'breakfast'|'lunch'|'dinner'|'snack', portionG?, kcalLow, kcalHigh, proteinG, carbG, fatG}): สร้าง pending food log card
- log_water({ml: number 50-5000}): บันทึกน้ำดื่ม
- weigh_in({weightKg: 20-400, bodyFatPct?: 3-60}): บันทึกน้ำหนัก
- set_mood({energy: 1-5, note?: string}): บันทึก mood/พลังงาน
- log_exercise({...}): บันทึกการออกกำลังกาย`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    toolsCalled: { type: 'array', items: { type: 'string' } },
    toolArgs: { type: 'object', additionalProperties: true },
    replyText: { type: 'string' },
  },
  required: ['toolsCalled', 'toolArgs', 'replyText'],
};

function buildSimulationPrompt(systemPrompt: string, userMessage: string): string {
  return `คุณกำลังจำลองการตัดสินใจของ chat AI โค้ชดี
อ่าน SYSTEM_PROMPT + USER_MESSAGE แล้วบอกว่า**คุณจะเรียก tools อะไรบ้าง** พร้อม arguments
ห้าม execute tools จริง ตอบเป็น JSON ตาม schema

═══ SYSTEM_PROMPT ═══
${systemPrompt}

═══ ${TOOL_DEFS} ═══

═══ USER_MESSAGE ═══
${userMessage}

═══ INSTRUCTIONS ═══
- toolsCalled: array ของชื่อ tools ตามลำดับที่จะ call (เช่น ["search_food", "log_food"])
- toolArgs: object key=ชื่อ tool, value=arguments (object) ที่จะส่งให้ tool ครั้งสุดท้าย
- replyText: text ที่จะตอบ user (ภาษาไทย ตาม STYLE_RULES)

ตอบ JSON เท่านั้น`;
}

type ClaudeCallResult = {
  toolsCalled: string[];
  toolArgs: Record<string, unknown>;
  replyText: string;
};

async function callClaude(prompt: string): Promise<ClaudeCallResult> {
  const { stdout } = await execFileAsync(
    'claude',
    ['-p', prompt, '--model', 'haiku', '--output-format', 'json', '--json-schema', JSON.stringify(RESPONSE_SCHEMA)],
    { encoding: 'utf-8', cwd: '/tmp', maxBuffer: 5 * 1024 * 1024 },
  );
  const wrapper = JSON.parse(stdout) as {
    result: string;
    is_error: boolean;
    structured_output?: ClaudeCallResult;
  };
  if (wrapper.is_error) throw new Error(wrapper.result || 'unknown error');
  if (wrapper.structured_output) return wrapper.structured_output;
  const raw = (wrapper.result ?? '').replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
  return JSON.parse(raw) as ClaudeCallResult;
}

function isSubset(actual: Record<string, unknown>, expected: Record<string, unknown>): boolean {
  for (const [k, v] of Object.entries(expected)) {
    if (actual[k] !== v) return false;
  }
  return true;
}

async function runCase(gc: GoldenCase): Promise<EvalResult> {
  const start = Date.now();
  const failures: string[] = [];
  let toolsCalledActual: string[] = [];

  try {
    const systemPrompt = buildSystemPrompt(STUB_MEMORY);
    const fullPrompt = buildSimulationPrompt(systemPrompt, gc.userMessage);
    const res = await callClaude(fullPrompt);
    toolsCalledActual = res.toolsCalled ?? [];

    // Tools-called assertions
    for (const expected of gc.expect.toolsCalled) {
      if (!toolsCalledActual.includes(expected)) {
        failures.push(`expected tool "${expected}" to be called, got: [${toolsCalledActual.join(', ')}]`);
      }
    }
    if (gc.expect.toolsCalled.length === 0 && toolsCalledActual.length > 0) {
      failures.push(`expected NO tools, but called: [${toolsCalledActual.join(', ')}]`);
    }

    // toolArgs assertions — handle both single-object and array-of-objects
    // (Claude sometimes returns array when logging multiple items per meal)
    if (gc.expect.toolArgs) {
      for (const [toolName, expectedArgs] of Object.entries(gc.expect.toolArgs)) {
        const raw = res.toolArgs[toolName];
        if (!raw) {
          failures.push(`${toolName} args missing — expected ${JSON.stringify(expectedArgs)}`);
          continue;
        }
        const items: Record<string, unknown>[] = Array.isArray(raw)
          ? (raw as Record<string, unknown>[])
          : [raw as Record<string, unknown>];
        // Every logged item must satisfy the expected subset (e.g. all same mealType)
        const failing = items.filter((item) => !isSubset(item, expectedArgs));
        if (failing.length > 0) {
          failures.push(
            `${toolName} args mismatch: expected ${JSON.stringify(expectedArgs)}, got ${JSON.stringify(raw)}`,
          );
        }
      }
    }

    // Response text assertions
    const finalText = res.replyText ?? '';
    if (gc.expect.mustContainOneOf) {
      const found = gc.expect.mustContainOneOf.some((s) => finalText.includes(s));
      if (!found) {
        failures.push(
          `response must contain one of [${gc.expect.mustContainOneOf.join(' | ')}], got: "${finalText.slice(0, 120)}"`,
        );
      }
    }
    if (gc.expect.notInResponse) {
      for (const forbidden of gc.expect.notInResponse) {
        if (finalText.includes(forbidden)) {
          failures.push(`response must NOT contain "${forbidden}", but it did`);
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

async function main() {
  const filterArg = process.argv.indexOf('--filter');
  const filterPattern = filterArg !== -1 ? process.argv[filterArg + 1] : null;
  const limitArg = process.argv.indexOf('--limit');
  const limitN = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : null;

  const allCases = [...(foodCases as GoldenCase[]), ...(otherCases as GoldenCase[])];
  let cases = filterPattern ? allCases.filter((c) => c.id.startsWith(filterPattern)) : allCases;
  if (limitN && limitN > 0) cases = cases.slice(0, limitN);

  console.log(
    `\n🧪 Eval harness (Claude Haiku via CLI) — ${cases.length} cases${
      filterPattern ? ` (filter: "${filterPattern}")` : ''
    }${limitN ? ` (limit: ${limitN})` : ''}\n`,
  );

  let passed = 0;
  let failed = 0;

  const printResult = (result: EvalResult) => {
    process.stdout.write(`  ${result.case.id.padEnd(14)} ${result.case.description.slice(0, 50).padEnd(52)}`);
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
  };

  // Run in parallel batches of CONCURRENCY to keep claude CLI from queueing.
  for (let i = 0; i < cases.length; i += CONCURRENCY) {
    const batch = cases.slice(i, i + CONCURRENCY);
    console.log(`\n── batch ${i / CONCURRENCY + 1} (cases ${i + 1}-${i + batch.length}) ──`);
    const results = await Promise.all(batch.map((gc) => runCase(gc)));
    for (const result of results) printResult(result);
  }

  console.log(`\n${passed}/${cases.length} passed${failed > 0 ? `, ${failed} failed` : ''}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
