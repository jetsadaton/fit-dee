# Progressive Overload

> Owner-confirmed 2026-05-02. ห้าม AI เดาเกินจากนี้.

## กฎเพิ่ม weight

**Trigger**: ทำครบทุก set ทุก rep **2 session ติดกัน** → แนะนำเพิ่ม weight รอบถัดไป

**Increment ต่อประเภท**:

| ประเภท     | ตัวอย่าง                     | Increment      |
| ---------- | ---------------------------- | -------------- |
| Barbell    | Squat, Deadlift, Bench Press | +2.5 kg        |
| Dumbbell   | Dumbbell Press, DB Row       | +1 kg          |
| Bodyweight | Push-up, Pull-up, Dip        | +1 rep per set |

## Confirm card "ไหวมั้ย"

เมื่อถึง threshold → โค้ชแสดง confirm card:

- **"ไหว"** → บันทึก weight ใหม่ลง plan
- **"ไม่ไหว"** → prompt ให้ user พิมพ์ weight ที่อยากอยู่เอง (ไม่ clamp อัตโนมัติ)

## Deload

**ไม่มี deload อัตโนมัติ** — โค้ชแนะนำเมื่อ detect สัญญาณจาก user เท่านั้น

**Deload trigger keywords** (fuzzy / substring):

- "เหนื่อยมาก", "ล้ามาก", "ไม่มีแรง"
- "ปวดกล้ามเนื้อตลอด", "ปวดไม่หาย"
- "ไม่อยากออกกำลังกายเลย", "หมดไฟ"
- "นอนไม่หลับ", "ฟื้นช้า"
- "หนักไป", "น้ำหนักมากไป"

**เมื่อ detect → โค้ชถาม user ก่อน** ว่าอยากทำอะไร:

| User ตอบ                 | Action                                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| รับ deload               | ปรับ plan อัตโนมัติ — ลด weight_kg_target ทุก exercise ลง 40% เป็นเวลา 1 สัปดาห์ แล้ว restore กลับ |
| "พัก" / "หยุดสัปดาห์นี้" | ตั้ง plan สัปดาห์นี้เป็น rest week (ไม่มี session)                                                 |
| ปฏิเสธ                   | คุยต่อตามปกติ ไม่บังคับ                                                                            |

## Implementation notes

- Confirm card "ไหวมั้ย" → render ผ่าน tool call payload (เหมือน `FoodConfirmCard`) — Phase 3
- Deload weight adjustment → `lib/services/recalibration.ts` + `workout-plans` repo update — Phase 3
- Trigger detection ทำใน Kimi (system prompt) — ไม่ใช่ regex server-side (v1)
- ทบทวน increment table เมื่อเพิ่ม exercise catalog ใหม่ (Phase 3+)
