# PDPA — Consent & Data Retention

> Owner-confirmed 2026-05-02. ห้าม AI เดาเกินจากนี้.

## Consent (สมัครครั้งแรก)

- **1 checkbox รวม** — Terms of Service + Privacy Policy
- เก็บใน `users.consents` jsonb: `{ version, accepted_at }`
- ถ้า policy เปลี่ยน → บังคับ accept ใหม่ก่อนใช้ app ได้ (gate ที่ middleware)

## Data retention

| ประเภทข้อมูล                               | Retention                                                   |
| ------------------------------------------ | ----------------------------------------------------------- |
| ข้อมูลโปรไฟล์ (น้ำหนัก, ส่วนสูง, เป้าหมาย) | ตลอดชีพ account                                             |
| Log อาหาร / น้ำ / ออกกำลังกาย / อารมณ์     | ตลอดชีพ account                                             |
| ข้อความแชท                                 | ตลอดชีพ account                                             |
| รูปภาพอาหาร (Vercel Blob)                  | **30 วัน** → ลบอัตโนมัติ                                    |
| รูปภาพร่างกาย                              | **ไม่เก็บ blob** — Kimi วิเคราะห์แล้วเก็บเป็น text เท่านั้น |

## Account deletion

1. User ขอลบ → `users.deleted_at = now()` (soft delete)
2. App block login ทันที
3. หลัง 30 วัน → Inngest job hard delete ทุกอย่าง:
   - ลบ rows ทุก table ที่ FK ชี้ไป `users.id`
   - ลบ Vercel Blob objects ของ user
   - ลบ Upstash Redis keys ของ user

## Image expiry (food photos)

- `attachments.expires_at = created_at + 30 days`
- Inngest cron job (Phase 3) sweep `WHERE expires_at < now()` → delete Blob + row
- Signed URL TTL ควรสั้นกว่า retention: ใช้ 1 วัน (refresh on demand)

## Implementation notes

- `users.consents` jsonb schema: `Array<{ version: string; accepted_at: string }>`
- Consent version string: semver-like เช่น `"tos-2026-05-02"`
- Hard delete job → `inngest/functions/account-cleanup.ts` (Phase 3)
- รูปร่างกาย: Kimi วิเคราะห์ → เก็บ text ใน `messages` หรือ `memory_blocks` → ไม่สร้าง `attachments` row
