# Working Principles

Cross-cutting rules ทุก layer ต้องอ่านก่อนแก้อะไรไม่ trivial.
Distilled from Andrej Karpathy's collaboration skills (https://github.com/forrestchang/andrej-karpathy-skills).

## 1. Think Before Coding — surface assumptions first

- คำขอกำกวม → **หยุดถาม** ห้ามเดาแล้วเขียน
- มีหลายทางเลือก → **list options** ให้ user เลือก ห้ามเลือกเงียบๆ
- ระบุ assumption ตรงๆ: _"ผมจะทำ X โดยสมมติว่า Y — ใช่มั้ย?"_
- ก่อนเขียน data-layer → ตรวจ schema (Drizzle schema file). **ห้ามเดาชื่อ column / type / FK**
- ก่อนเรียก LLM tool → ตรวจ tool schema ใน `lib/ai/tools/` ห้าม invent tool name

## 2. Surgical Changes — touch only what's needed

- ทุกบรรทัดที่แก้ ต้อง trace กลับไปที่ request ของ user ได้
- **ห้าม drive-by refactor** ห้าม "ปรับให้ดีขึ้น" code ข้างเคียง / comment / format
- ห้าม rename var, reorder imports, เปลี่ยน quote style, re-indent บรรทัดรอบๆ
- ถ้าการแก้ทำให้ code orphan ลบเฉพาะที่ _edit ของคุณ_ ทำให้ orphan; dead code เก่าๆ ปล่อยไว้
- เห็นจุดน่าแก้ → **flag แยก** ("เห็นว่า X น่าจะมีบั๊ก แก้เลยมั้ย?") ห้าม silent-fix

## 3. Small, reversible steps

- หลาย commit เล็กๆ ดีกว่า commit ใหญ่ก้อนเดียว
- ทุก step ต้อง verify (test / typecheck / lint) ก่อนไป step ถัดไป
- ใช้ `pnpm typecheck` + `pnpm lint` หลังแก้ไฟล์สำคัญทุกครั้ง

## 4. Never invent business rules

Domain knowledge ของ Coachly **ห้ามเดา** — ดู `.claude/topics/`:

- TDEE formula + adjustments per goal → `topics/tdee-and-macros.md`
- kcal floors + disordered eating triggers → `topics/safety-floors.md`
- PDPA consent versions + retention → `topics/pdpa.md`
- Food DB precedence → `topics/food-db.md`
- Progressive overload rules → `topics/progressive-overload.md`

ถ้า team confirm กฎใหม่ที่ยังไม่มีในเอกสาร → **เสนอเพิ่ม** ไปไฟล์ที่เกี่ยวข้องก่อน implement

## 5. LLM-specific principles (Coachly)

- **Confirmation before write** — ทุก tool call ที่ persist ข้อมูล (`log_food`, `log_water`, `log_exercise`, `update_profile`) ต้อง render confirm card ใน chat ก่อน commit
- **Show uncertainty as range** — ห้ามคืน "642 kcal" จากรูป ใช้ "450–550 kcal" + confidence level
- **Tight tool schemas** — enum + semantic IDs (`thai_pad_kra_pao_chicken`) ไม่ใช่ UUID ดิบ
- **Composite tools** — `log_meal_with_photo` ทีเดียวจบ ดีกว่าแยก `set_meal_name` / `set_kcal` หลายอัน
- **Eval before merge** — แก้ system prompt / tool schema → ต้องผ่าน `pnpm eval` (50 golden Thai food prompts) ห้าม regress

## 6. Privacy-first

- ห้ามส่ง PII (email, ชื่อ-นามสกุล, เบอร์) ไป Kimi — ส่งแค่ `user_id_hash` + numeric profile
- รูปอาหาร/ร่างกาย → Vercel Blob private bucket + signed URL + `expires_at` ในตาราง `attachments`
- ทุก consent → log version + timestamp ใน `users.consents` jsonb
