// AI-generated insights for the Today dashboard.
// Uses moonshot-v1-8k (fast, no thinking) — not K2.6 — because insights are
// a non-interactive server-side task that doesn't need vision or tool calls.
// No PII ever sent (rules/backend.md). Returns [] on any error.

import { generateText } from 'ai';
import { z } from 'zod';
import { kimi, FAST_MODEL } from '@/lib/ai/kimi';
import type { TodaySnapshot } from '@/lib/services/today';
import type { Insight, InsightRange } from '@/lib/types/dto/insights';

const insightSchema = z
  .array(
    z.object({
      tone: z.enum(['warn', 'good', 'info']),
      text: z.string().max(120),
    }),
  )
  .min(1)
  .max(4);

function buildPrompt(snapshot: TodaySnapshot, range: InsightRange): string {
  const waterGlasses = Math.round(snapshot.waterMl / 250);
  const jsonInstruction = `ตอบด้วย JSON array เท่านั้น รูปแบบ: [{"tone":"warn"|"good"|"info","text":"ข้อความภาษาไทย"},...] ห้ามมี markdown หรือข้อความอื่น`;

  if (range === 'today') {
    const workoutStatus =
      snapshot.todayWorkout === undefined
        ? 'ยังไม่มีแผน'
        : snapshot.todayWorkout === null
          ? 'วันพัก'
          : 'มีแผน (ยังไม่ได้เริ่ม)';
    return `คุณคือโค้ชฟิตเนส วิเคราะห์ข้อมูลวันนี้ สรุป 2-3 insights กระชับเป็นภาษาไทย เน้นตัวเลขสำคัญด้วย <b>...</b>

ข้อมูลวันนี้:
- แคลอรี่: ${snapshot.kcalEaten} / ${snapshot.kcalGoal} kcal (เผาผลาญ ${snapshot.kcalBurned})
- โปรตีน: ${snapshot.proteinEaten}g / ${snapshot.proteinGoal}g
- คาร์บ: ${snapshot.carbEaten}g / ${snapshot.carbGoal}g
- ไขมัน: ${snapshot.fatEaten}g / ${snapshot.fatGoal}g
- น้ำ: ${waterGlasses} / 8 แก้ว
- พลังงาน: ${snapshot.moodEnergy ?? 'ยังไม่บันทึก'} / 5
- ออกกำลังกาย: ${workoutStatus}

${jsonInstruction}`;
  }

  if (range === 'week') {
    const proteinGap = snapshot.proteinGoal > 0 ? snapshot.proteinGoal - snapshot.week7AvgProteinG : null;
    return `คุณคือโค้ชฟิตเนส วิเคราะห์ข้อมูล 7 วัน สรุป 2-3 insights กระชับเป็นภาษาไทย เน้นตัวเลขด้วย <b>...</b>

ข้อมูล 7 วัน:
- น้ำหนักเปลี่ยน: ${snapshot.week7WeightDeltaKg != null ? `${snapshot.week7WeightDeltaKg > 0 ? '+' : ''}${snapshot.week7WeightDeltaKg} kg` : 'ไม่มีข้อมูล'}
- แคลอรี่เฉลี่ย: ${snapshot.week7AvgKcal} / ${snapshot.kcalGoal} kcal/วัน
- โปรตีนเฉลี่ย: ${snapshot.week7AvgProteinG}g / ${snapshot.proteinGoal}g${proteinGap != null && proteinGap > 0 ? ` (ขาด ${proteinGap}g)` : ''}
- น้ำเฉลี่ย: ${snapshot.week7AvgWaterGlasses} แก้ว/วัน
- ออกกำลังกาย: ${snapshot.week7WorkoutCount}/${snapshot.daysPerWeek} วัน

${jsonInstruction}`;
  }

  // month
  const goalProgress =
    snapshot.weightKgInitial != null && snapshot.latestWeightKg != null && snapshot.targetWeightKg != null
      ? `เริ่ม ${snapshot.weightKgInitial} → ตอนนี้ ${snapshot.latestWeightKg} → เป้า ${snapshot.targetWeightKg} kg`
      : 'ไม่มีข้อมูลน้ำหนัก';
  return `คุณคือโค้ชฟิตเนส วิเคราะห์ข้อมูล 30 วัน สรุป 2-3 insights กระชับเป็นภาษาไทย เน้นตัวเลขด้วย <b>...</b>

ข้อมูล 30 วัน:
- น้ำหนักเปลี่ยน: ${snapshot.month30WeightDeltaKg != null ? `${snapshot.month30WeightDeltaKg > 0 ? '+' : ''}${snapshot.month30WeightDeltaKg} kg` : 'ไม่มีข้อมูล'}
- เป้าหมาย: ${goalProgress}
- ออกกำลังกาย: ${snapshot.month30WorkoutCount}/30 วัน
- วันถึงเป้าแคล: ${snapshot.month30DaysHitKcal}/30 วัน
- Streak: ${snapshot.streakCurrent} วัน (สูงสุด ${snapshot.streakLongest})

${jsonInstruction}`;
}

function extractJson(text: string): unknown {
  // Strip markdown code fences if present
  const stripped = text.replace(/```(?:json)?\n?/g, '').trim();
  // Find the first '[' and last ']'
  const start = stripped.indexOf('[');
  const end = stripped.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function generateInsights(snapshot: TodaySnapshot, range: InsightRange): Promise<Insight[]> {
  const abort = AbortSignal.timeout(25_000); // 25s hard limit
  try {
    const { text } = await generateText({
      model: kimi(FAST_MODEL),
      temperature: 1, // required by kimi-k2.6 thinking mode
      prompt: buildPrompt(snapshot, range),
      abortSignal: abort,
    });
    const raw = extractJson(text);
    const parsed = insightSchema.safeParse(raw);
    if (!parsed.success) return [];
    return parsed.data;
  } catch {
    return [];
  }
}
