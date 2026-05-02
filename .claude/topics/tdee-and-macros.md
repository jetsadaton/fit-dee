# TDEE + Macros

**Owner-confirmed rules (2026-05-02).** AI ห้ามเดา ห้ามแก้ฝั่ง code โดยไม่ผ่าน owner. ถ้ารู้สึกว่าอะไรขัด — เสนอ patch ไฟล์นี้ก่อน.

ใช้ที่: `lib/services/tdee.ts`, `app/plan-preview/*` (A3 screen), `app/onboarding/*` (A2 step 4 estimate), `app/api/profile/route.ts`, AI tool `update_profile`.

---

## 1. BMR (Basal Metabolic Rate)

### Default — Mifflin-St Jeor (1990)

ใช้เมื่อ **ไม่มี body_fat_pct** (ผู้ใช้ส่วนใหญ่ในกลุ่มมือใหม่):

```
ชาย (sex='m'):  BMR = 10·kg + 6.25·cm − 5·age + 5
หญิง (sex='f'): BMR = 10·kg + 6.25·cm − 5·age − 161
อื่น (sex='o'): ใช้สูตรหญิง (conservative kcal floor)
```

### Override — Katch-McArdle

ใช้เมื่อ **user ใส่ body_fat_pct** (จาก scale sync หรือ manual entry):

```
LBM (Lean Body Mass) = weight_kg × (1 − body_fat_pct / 100)
BMR = 370 + 21.6 × LBM
```

**Switch logic** (in `tdee.ts`):

```ts
const bmr = bodyFatPct != null ? katchMcArdle(weightKg, bodyFatPct) : mifflinStJeor(sex, weightKg, heightCm, age);
```

ค่า `body_fat_pct` ยังไม่อยู่ใน `user_profiles` schema (ดู `lib/db/schema.ts`) — ตอนรับ → เพิ่ม column `body_fat_pct numeric(4,1) null` ผ่าน migration ใหม่ (Phase 2 task).

---

## 2. Activity Factor

| `activity_level` | label (TH)                     | factor |
| ---------------- | ------------------------------ | ------ |
| `sit`            | นั่งโต๊ะ ไม่ออกกำลัง           | 1.2    |
| `walk`           | เดินบ่อย / ออก 1-3 วัน/สัปดาห์ | 1.375  |
| `move`           | ออก 3-5 วัน/สัปดาห์            | 1.55   |
| `active`         | 6-7 วัน หรืองานใช้แรง          | 1.725  |

```
TDEE = BMR × activity_factor
```

---

## 3. Goal Adjustment

| `goal` | adjustment      | คำอธิบาย                                  |
| ------ | --------------- | ----------------------------------------- |
| `lose` | TDEE × **0.80** | deficit 20% → ~0.5–0.7 kg/สัปดาห์         |
| `gain` | TDEE × **1.12** | surplus 12% → ~0.25–0.5 kg/สัปดาห์ (lean) |
| `fit`  | TDEE × **1.00** | maintain                                  |

```
kcal_target = round(TDEE × goalFactor)
```

---

## 4. kcal Floor (safety)

ห้ามแนะนำต่ำกว่านี้แม้สูตรจะคำนวณได้น้อยกว่า:

| sex | floor (kcal/วัน)        |
| --- | ----------------------- |
| `m` | **1500**                |
| `f` | **1200**                |
| `o` | **1200** (conservative) |

```ts
kcal_target = Math.max(rawKcal, floor(sex));
```

ถ้า `rawKcal < floor` → service log warning (จะใช้ใน safety-floors topic ถ้า ED triggers ปรากฏ).

---

## 5. Macro Split — g/kg target (option B)

โปรตีนและไขมันคำนวณจาก **body weight (kg)**, คาร์บได้ **ส่วนที่เหลือ**:

| `goal` | protein g/kg | fat g/kg | carb             |
| ------ | ------------ | -------- | ---------------- |
| `lose` | **2.0**      | **0.8**  | เติมส่วนที่เหลือ |
| `gain` | **1.8**      | **0.9**  | เติมส่วนที่เหลือ |
| `fit`  | **1.6**      | **0.9**  | เติมส่วนที่เหลือ |

### Conversion to grams + safety

```
proteinKcal = proteinG × 4
fatKcal     = fatG × 9
carbKcal    = max(0, kcal_target − proteinKcal − fatKcal)
carbG       = carbKcal / 4
```

ถ้า `carbKcal < 0` (เช่น kcal_target ต่ำมาก หลัง floor + protein/fat สูง) → **scale protein + fat ลง proportionally** จนกว่า carbG ≥ 50 g (minimum สำหรับ brain glycogen).

ห้ามคืน `carbG = 0` ให้ user — ถือเป็น signal ของ infeasible plan, service ต้อง throw `InfeasiblePlanError` ให้ caller (UI แสดง "ลองปรับเป้าหมายดูนะ").

---

## 6. Onboarding step 4 — "~N สัปดาห์ถึงเป้า"

```ts
// rough estimate from energy balance (1 kg fat ≈ 7700 kcal)
const dailyDelta = Math.abs(tdee - kcal_target); // kcal/day deficit or surplus
const weeklyDelta = dailyDelta * 7;
const weeklyKgChange = weeklyDelta / 7700;
const weightDeltaKg = Math.abs(weight_kg - target_weight_kg);
const weeks = Math.max(2, Math.ceil(weightDeltaKg / weeklyKgChange));
```

**ห้าม** ใช้สูตร mock เดิม `Math.ceil(|w − target| × 2)` — ผิดสำหรับคนน้ำหนักน้อย/มาก หรือ deficit สูง/ต่ำ.

---

## 7. Recalibration (Phase 3, every 14 days)

ทุก 14 วันนับจาก `plan_recalibrated_at`, Inngest job รัน:

1. ดึง weight trend ล่าสุด 14 วัน (slope จาก `weight_logs`)
2. ถ้า:
   - `goal=lose` แต่ trend ≥ 0 → ลด `kcal_target` อีก −5% (ขั้น 50 kcal)
   - `goal=lose` แต่ trend < −1.0 kg/wk → เพิ่ม +5% (ลด deficit, ป้องกัน plateau)
   - `goal=gain` ทำ mirror image
3. Update `kcal_target`, recompute macros, set `plan_recalibrated_at = now()`
4. Insert `messages` (role='assistant') บอก user ว่า "ปรับเป้าให้แล้วเพราะ X"

**ห้าม** auto-adjust นอก Inngest cron (เช่น ทุก request) — protect against thrashing.

---

## 8. References

- Mifflin et al. (1990). _A new predictive equation for resting energy expenditure in healthy individuals._ Am J Clin Nutr 51(2): 241-247.
- Katch & McArdle (1996). _Exercise Physiology_ — Lean body mass equation
- ISSN Position Stand on Protein and Exercise (2017): 1.4–2.0 g protein/kg/day for active individuals
- ACSM (2016): Sports nutrition guidelines
