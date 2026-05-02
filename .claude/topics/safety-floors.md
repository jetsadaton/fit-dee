# Safety Floors & ED Guardrails

> Owner-confirmed 2026-05-02. ห้าม AI เดาเกินจากนี้.

## Kcal floors

| Sex                  | Floor                      |
| -------------------- | -------------------------- |
| female               | 1,200 kcal/day             |
| male                 | 1,500 kcal/day             |
| non-binary / unknown | 1,500 kcal/day (safe side) |

ใช้ทุกที่ที่คำนวณ target kcal: plan-generator, TDEE service, system prompt.  
ถ้า TDEE - deficit < floor → clamp ที่ floor โดยไม่ลดเพิ่ม.

## ED trigger levels

### ระดับ 1 — Risky behavior

**Coach response**: เปลี่ยน tone — ไม่ให้กำลังใจพฤติกรรมนั้น + แนะนำให้กินให้พอ. คุยต่อได้ตามปกติ.

**Triggers (detect แบบ fuzzy / substring)**:

- kcal ที่ user พูดถึง < floor ของ sex นั้น (ตรวจ numeric)
- "อดอาหาร", "อดข้าว", "ไม่กิน"
- "อาเจียน", "ถ่ายออก", "ยาถ่าย"

### ระดับ 2 — Crisis

**Coach response**: หยุดโหมดโค้ชทันที → แสดง DMH 1323 ในข้อความ → คุยต่อได้ (ไม่ lock input). ไม่ต้อง log event พิเศษ (v1).

**Triggers**:

- "เกลียดตัวเอง", "เกลียดร่างกาย"
- "ไม่อยากมีชีวิต", "อยากตาย"
- "ทำร้ายตัวเอง", "ทำร้ายร่างกาย"

## DMH 1323 message template

```
หยุดสักครู่นะ 🙏 ถ้ารู้สึกไม่โอเคกับตัวเองหรือต้องการคุยกับใครสักคน
โทรหากรมสุขภาพจิตได้เลย → สายด่วน 1323 (24 ชม. ฟรี)
```

## Implementation notes

- System prompt v1 (`lib/ai/prompts/system-v1.ts`) อ้างอิง floor 1,200F/1,500M + DMH 1323 — ตรงกับที่นี่แล้ว
- Plan generator (`lib/services/plan-generator.ts`) ต้อง clamp ที่ floor ก่อน return target kcal
- Trigger detection ทำใน Kimi (system prompt instructions) — ไม่ใช่ regex ฝั่ง server (v1)
- ทบทวน trigger list + escalation flow ก่อน Phase 4 (push notifications)
