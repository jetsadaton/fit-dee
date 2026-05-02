# Food DB — Data Sources & Precedence

> Owner-confirmed 2026-05-02. ห้าม AI เดาเกินจากนี้.

## Precedence (สูง → ต่ำ)

```
user_edit > vision_cache > Thai DB > USDA > LLM estimate
```

| Source         | คืออะไร                                               | ใช้เมื่อ                     |
| -------------- | ----------------------------------------------------- | ---------------------------- |
| `user_edit`    | ค่าที่ user แก้ไขเองผ่าน UI หน้าแยก                   | มีอยู่ใน DB สำหรับ food นั้น |
| `vision_cache` | ผล Kimi vision ที่ cache ไว้จากรูปที่เคยวิเคราะห์แล้ว | รูปซ้ำ / hash ตรง            |
| `thai_db`      | ฐานข้อมูลอาหารไทย (กรมอนามัย หรือเทียบเท่า)           | มี record ตรงกัน             |
| `usda`         | USDA FoodData Central                                 | ไม่เจอใน Thai DB             |
| `llm_estimate` | Kimi ประมาณจาก training data                          | ไม่เจอใน DB ใดเลย            |

ลำดับนี้ใช้ใน `lib/services/food-resolver.ts` (Phase 3) และ `foods.source` column ใน DB

## LLM estimate flow

1. ไม่เจอใน DB → Kimi estimate ทันที
2. แสดงใน confirm card พร้อม badge "ประมาณการจาก AI อาจคลาดเคลื่อน"
3. Confirm card มี 2 ปุ่ม: **"ยืนยัน"** และ **"แก้เอง"**
4. กด "แก้เอง" → เปิด manual input form (kcal / protein / carb / fat)
5. บันทึก `source = 'llm_estimate'` ไว้ใน `food_logs` เพื่อ audit

## User edit flow

- หน้าแยก (Phase 3) สำหรับ edit food log ย้อนหลัง
- เมื่อ user แก้ → บันทึกเป็น `source = 'user_edit'` ถาวรใน `foods` table
- ครั้งถัดไปที่ search ชื่อเดิม → `user_edit` ขึ้นก่อนเลย

## Implementation notes

- `foods.source` enum: `'thai_db' | 'usda' | 'llm_estimate' | 'user_edit' | 'vision_cache'`
- Thai DB ยังไม่มีใน v1 — `search_food` tool ใช้ ilike text search บน `foods` table ที่ seed ไว้
- Vision cache → `attachments` + `foods` ที่ flag `source = 'vision_cache'` (Phase 3)
- food-resolver service (Phase 3) จะ abstract precedence logic ออกจาก tool
