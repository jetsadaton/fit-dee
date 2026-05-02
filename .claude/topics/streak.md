# Streak Definition

**Owner-confirmed rules (2026-05-02).** AI ห้ามเดา ห้ามแก้ฝั่ง code โดยไม่ผ่าน owner.

ใช้ที่: `lib/services/streak.ts`, `components/coach/primitives.tsx` (`<StreakFlame>`), Today screen header, Inngest job `daily-summary` (Phase 3).

---

## 1. นิยาม "active day"

หนึ่งวันนับเป็น **active** ถ้า user ทำอย่างใดอย่างหนึ่งภายในวันนั้น (00:00–23:59 ใน user timezone, default `Asia/Bangkok`):

| เงื่อนไข                                                            | ข้อมูลที่ใช้                                                                       |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **A.** บันทึกอาหารอย่างน้อย 1 มื้อ (confirmed)                      | `food_logs WHERE user_id=? AND DATE(logged_at)=? AND confirmed_at IS NOT NULL`     |
| **B.** มี workout session ที่จบแล้ว (เฉพาะวันที่ตามแผนต้อง workout) | `workout_sessions WHERE user_id=? AND DATE(started_at)=? AND ended_at IS NOT NULL` |

### Rest day exemption

ถ้าวันนั้นเป็น **rest day ตามแผน** (`workout_plans.days[<day>].rest_day === true`) → **ไม่บังคับ workout**, แค่เงื่อนไข A (log อาหาร 1 มื้อ) ก็พอ.

ถ้าวันนั้นเป็น workout day ตามแผน → A หรือ B อย่างใดอย่างหนึ่งก็ active (OR, ไม่ใช่ AND — log อาหารอย่างเดียวก็นับ).

```ts
function isActiveDay(date, plan, foodLogs, sessions) {
  const dayKey = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][getDay(date)];
  const isRestDay = plan?.days?.[dayKey]?.rest_day === true;

  const ateAtLeastOnce = foodLogs.some((l) => sameDay(l.logged_at, date) && l.confirmed_at);
  if (ateAtLeastOnce) return true;

  if (!isRestDay) {
    const finishedWorkout = sessions.some((s) => sameDay(s.started_at, date) && s.ended_at);
    if (finishedWorkout) return true;
  }
  return false;
}
```

---

## 2. Grace days

ผู้ใช้ **มีโควต้าพลาด 2 วัน/สัปดาห์** (calendar week) โดยไม่รีเซ็ต streak.

- Calendar week = **จันทร์ 00:00 → อาทิตย์ 23:59** (ตาม `workout_plans.week_starts_on`, ใน user tz)
- Budget refresh ทุกจันทร์ 00:00 — ไม่ rollover
- ถ้า miss > 2 วันในสัปดาห์เดียวกัน → **streak reset เป็น 0** ทันทีที่วันที่ 3 ที่ miss

```ts
const MAX_GRACE_PER_WEEK = 2;

// Within current calendar week
const missedThisWeek = daysFromMondayToToday.filter(d => !isActiveDay(d, ...)).length;

if (missedThisWeek > MAX_GRACE_PER_WEEK) {
  return { current: 0, reset: true, reason: 'exceeded grace budget' };
}
```

Grace days **ไม่นับเป็น active** — แค่ "พลาดได้โดยไม่รีเซ็ต". streak counter เพิ่มขึ้นเฉพาะวันที่ active จริง.

---

## 3. Counter semantics

| field (`streaks` table) | ความหมาย                                                |
| ----------------------- | ------------------------------------------------------- |
| `current`               | จำนวนวัน active **ติดต่อกันล่าสุด** ภายใต้ grace budget |
| `longest`               | best streak ตลอดกาล                                     |
| `last_active_date`      | วันสุดท้ายที่ตัดสินว่า active (ใช้ resume logic)        |

### Update flow (Inngest nightly job, 23:55 user-tz)

1. ดึง today's data → `isActiveDay(today)`
2. ถ้า active:
   - `current += 1`
   - `last_active_date = today`
   - `longest = max(longest, current)`
3. ถ้า not-active:
   - คำนวณ `missedThisWeek` ใน calendar week
   - ถ้า `missedThisWeek > 2` → `current = 0`
   - มิฉะนั้น `current` คงเดิม (ใช้ grace day)

### Edge cases

- **User ใหม่** (วันแรกที่ใช้ app): ถ้า active ในวันแรก → `current = 1, longest = 1`
- **เปลี่ยน plan กลางสัปดาห์**: ใช้ snapshot ของ `workout_plans` ที่ active ณ วันนั้น (มี `version` bump)
- **ย้าย timezone**: lock ที่ `users.locale` + tz หลังจาก onboarding (Phase 2 schema task — เพิ่ม `users.tz` column)

---

## 4. UI integration

`<StreakFlame count={n} />`:

- `n === 0` → ไอคอนเทา + "เริ่มสตรีคใหม่ได้เลย"
- `n >= 1 && n < 7` → ไอคอนสีปกติ + "🔥 N วัน"
- `n >= 7` → ไอคอนพร้อม animation `cdPulse` (มีอยู่แล้วใน globals.css)
- `n >= 30` → badge พิเศษ (ค่อย design ใน Phase 4)

ถ้า user เห็นค่า streak แต่กังวลว่า "ฉันพลาดมั้ย" → click → tooltip แสดง "ใช้ grace day ไป X / 2 ในสัปดาห์นี้".

---

## 5. Out of scope (ตอนนี้)

- **Freeze opt-in** (Duolingo style "ใช้ปลอดภัย" item) — Phase 2+ ถ้า retention drop
- **Streak share / leaderboard** — out of MVP
- **Streak insurance / monetization** — ห้าม (กระทบ trust, ขัด tone "กันเอง")

---

## 6. Test cases (golden)

ต้องมีใน `tests/services/streak.test.ts`:

1. ✅ เดี่ยววันแรก, log อาหาร → `current=1`
2. ✅ 5 วันติด, ทุกวัน log อาหาร → `current=5`
3. ✅ 5 วันติด, วันที่ 6 rest day + log อาหาร → `current=6`
4. ✅ 5 วันติด, วันที่ 6 rest day + ไม่ log → grace day, `current=5` คงเดิม
5. ✅ จันทร์-อังคาร miss + พุธ-อาทิตย์ active → `current=5` (grace 2 ใช้พอดี)
6. ✅ จันทร์-อังคาร-พุธ miss → `current=0` (เกิน grace)
7. ✅ workout day, complete workout เท่านั้น (ไม่ log อาหาร) → active
8. ✅ workout day, log อาหารเท่านั้น (ไม่ workout) → active
9. ✅ rest day, ไม่ log อาหาร, ไม่ workout → not active (ใช้ grace)
10. ✅ ข้ามสัปดาห์: grace budget refresh ที่จันทร์ใหม่
