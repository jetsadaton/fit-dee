# Import: กรมอนามัย 2018 Thai Food Composition Data

## Context

ไฟล์ `ตารางคุณค่า 2018.pdf.pdf` (รากโปรเจค, 82.3MB, 148 หน้า) คือ "ตารางแสดงคุณค่าทางโภชนาการของอาหารไทย" (Food Composition Table of Thai Foods) ฉบับปี 2561 จากสำนักโภชนาการ กรมอนามัย — เป็น PDF สแกน (image-based ไม่มี text layer)

Coachly มีข้อมูลอาหารไทยจาก BaoWio/HuggingFace (INMU 2015) อยู่แล้ว แต่เก็บแค่ 4 macros ส่วน PDF นี้ครอบคลุม 24 nutrient columns รวม fiber, minerals, vitamins — ต้องการ import ทั้งหมด

**ผลลัพธ์ที่ต้องการ**: เพิ่ม nutrient columns ใน `foods` table + upsert ข้อมูล 14 กลุ่มอาหาร (~800–1200 รายการ)

---

## PDF Structure

| หน้า      | เนื้อหา                                          |
| --------- | ------------------------------------------------ |
| 1–7       | Intro, food groups, methodology — ข้าม           |
| **8–122** | **ตารางข้อมูล 14 กลุ่มอาหาร — extract เหล่านี้** |
| 123+      | Folate, references, appendix — ข้าม              |

**กลุ่มอาหารตาม TOC:**

| หน้า    | กลุ่ม                                         |
| ------- | --------------------------------------------- |
| 8–12    | ธัญพืช (Cereals)                              |
| 13–16   | ราก/หัว (Starchy roots)                       |
| 17–22   | ถั่ว/เมล็ด/ถั่วเปลือกแข็ง (Pulses/seeds/nuts) |
| 23–42   | ผัก (Vegetables)                              |
| 43–56   | ผลไม้ (Fruits)                                |
| 57–62   | เนื้อสัตว์/เป็ด/ไก่ (Meat/poultry)            |
| 63–72   | ปลา/กุ้ง/สัตว์น้ำ (Fish/seafood)              |
| 73–76   | ไข่ (Eggs)                                    |
| 77–82   | นม (Milk)                                     |
| 83–86   | เครื่องเทศ (Spices)                           |
| 87–106  | อาหารปรุงสำเร็จ (Prepared dishes)             |
| 107–114 | ขนมหวาน (Desserts)                            |
| 115–116 | แมลง (Insects)                                |
| 117–122 | อื่นๆ (Misc)                                  |

**รูปแบบตาราง** (ต่อ 100g edible portion):

- Food ID (เช่น `01001`), ชื่อไทย, ชื่ออังกฤษ
- Main: Energy(kcal), Water(g), Protein(g), Fat(g), Carb(g), Fiber(g), Ash(g)
- Minerals: Ca, P, Mg, Na, K, Fe, Cu, Zn, I (mg/ug)
- Vitamins: Betacarotene, Retinol, VitA-RAE, B1, B2, Niacin, VitC, VitE (mg/ug)
- Other: Sugar(g)

Special values: `-` = ไม่ได้วิเคราะห์ → `null`, `tr` = trace → `0.001`

---

## Step 1: Extend Drizzle Schema

**File**: `lib/db/schema.ts` — เพิ่ม nullable columns ใน `foods` table (ต่อจากบรรทัด `fatGPer100g`)

```typescript
// Proximate
waterGPer100g:       numeric("water_g_per_100g",        { precision: 5, scale: 2 }),
fiberGPer100g:       numeric("fiber_g_per_100g",         { precision: 5, scale: 2 }),
sugarGPer100g:       numeric("sugar_g_per_100g",         { precision: 5, scale: 2 }),
ashGPer100g:         numeric("ash_g_per_100g",           { precision: 5, scale: 2 }),

// Minerals
calciumMgPer100g:    numeric("calcium_mg_per_100g",      { precision: 7, scale: 2 }),
phosphorusMgPer100g: numeric("phosphorus_mg_per_100g",   { precision: 7, scale: 2 }),
magnesiumMgPer100g:  numeric("magnesium_mg_per_100g",    { precision: 7, scale: 2 }),
sodiumMgPer100g:     numeric("sodium_mg_per_100g",       { precision: 7, scale: 2 }),
potassiumMgPer100g:  numeric("potassium_mg_per_100g",    { precision: 7, scale: 2 }),
ironMgPer100g:       numeric("iron_mg_per_100g",         { precision: 5, scale: 3 }),
copperMgPer100g:     numeric("copper_mg_per_100g",       { precision: 5, scale: 3 }),
zincMgPer100g:       numeric("zinc_mg_per_100g",         { precision: 5, scale: 3 }),
iodineUgPer100g:     numeric("iodine_ug_per_100g",       { precision: 7, scale: 2 }),

// Vitamins
vitaminAUgRaePer100g: numeric("vitamin_a_ug_rae_per_100g", { precision: 7, scale: 2 }),
thiaminMgPer100g:    numeric("thiamin_mg_per_100g",      { precision: 5, scale: 3 }),
riboflavinMgPer100g: numeric("riboflavin_mg_per_100g",   { precision: 5, scale: 3 }),
niacinMgPer100g:     numeric("niacin_mg_per_100g",       { precision: 5, scale: 2 }),
vitaminCMgPer100g:   numeric("vitamin_c_mg_per_100g",    { precision: 5, scale: 2 }),
vitaminEMgPer100g:   numeric("vitamin_e_mg_per_100g",    { precision: 5, scale: 2 }),
```

จากนั้น:

```bash
pnpm db:generate
pnpm db:migrate
```

---

## Step 2: Python Extraction Script

**File**: `scripts/extract_thai_nutrition_pdf.py`

### Install dependencies (ครั้งเดียว)

```bash
pip install pdf2image anthropic Pillow
brew install poppler   # macOS — ต้องการสำหรับ pdf2image
```

### Script

````python
#!/usr/bin/env python3
"""
Extract nutritional data from ตารางคุณค่า 2018.pdf.pdf using Claude Vision API.
Output: scripts/extracted/all_foods.json
"""
import base64, json, os, time
from pathlib import Path
from pdf2image import convert_from_path
import anthropic

PDF_PATH = "ตารางคุณค่า 2018.pdf.pdf"
OUTPUT_DIR = Path("scripts/extracted")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FIRST_DATA_PAGE = 8   # ตาม TOC
LAST_DATA_PAGE = 122

EXTRACT_PROMPT = """ตารางนี้แสดงคุณค่าทางโภชนาการต่อ 100g ของอาหารไทย
Extract ทุก data row ออกมาเป็น JSON array ด้วย fields เหล่านี้:
food_id, name_th, name_en,
energy_kcal, water_g, protein_g, fat_g, carb_g, fiber_g, ash_g,
calcium_mg, phosphorus_mg, magnesium_mg, sodium_mg, potassium_mg,
iron_mg, copper_mg, zinc_mg, iodine_ug,
vitamin_a_ug_rae, thiamin_mg, riboflavin_mg, niacin_mg, vitamin_c_mg, vitamin_e_mg,
sugar_g

กฎ:
- "-" หรือ "–" = null
- "tr" = 0.001
- ตัวเลขในวงเล็บ เช่น "(350)" = ค่าประมาณ ให้ใช้ตัวเลขนั้นได้เลย
- ถ้าหน้านี้ไม่มีตารางข้อมูล ให้ตอบ []
- ตอบเฉพาะ JSON array เท่านั้น ห้ามอธิบาย"""

client = anthropic.Anthropic()

def img_to_b64(img) -> str:
    import io
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.standard_b64encode(buf.getvalue()).decode()

def extract_page(page_num: int, img) -> list[dict]:
    cache_file = OUTPUT_DIR / f"page_{page_num:03d}.json"
    if cache_file.exists():
        print(f"  [cache] page {page_num}")
        return json.loads(cache_file.read_text())

    print(f"  [api]   page {page_num}")
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": img_to_b64(img)}},
                {"type": "text", "text": EXTRACT_PROMPT},
            ],
        }],
    )
    raw = response.content[0].text.strip()
    # strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        rows = json.loads(raw.strip())
    except json.JSONDecodeError:
        print(f"  [warn] parse error page {page_num}, saving raw")
        rows = []
    cache_file.write_text(json.dumps(rows, ensure_ascii=False, indent=2))
    time.sleep(0.5)  # gentle rate limit
    return rows

def main():
    print(f"Converting PDF pages {FIRST_DATA_PAGE}–{LAST_DATA_PAGE}...")
    pages = convert_from_path(
        PDF_PATH,
        first_page=FIRST_DATA_PAGE,
        last_page=LAST_DATA_PAGE,
        dpi=150,
    )
    print(f"Got {len(pages)} page images. Extracting...")

    all_rows = []
    for i, img in enumerate(pages):
        page_num = FIRST_DATA_PAGE + i
        rows = extract_page(page_num, img)
        all_rows.extend(rows)
        print(f"    → {len(rows)} rows (total so far: {len(all_rows)})")

    out = OUTPUT_DIR / "all_foods.json"
    out.write_text(json.dumps(all_rows, ensure_ascii=False, indent=2))
    print(f"\nDone! {len(all_rows)} foods → {out}")

if __name__ == "__main__":
    main()
````

### วิธีรัน

```bash
# ทดสอบหน้าเดียวก่อน (แก้ LAST_DATA_PAGE=8 ชั่วคราว)
ANTHROPIC_API_KEY=sk-... python scripts/extract_thai_nutrition_pdf.py

# รันทั้งหมด
python scripts/extract_thai_nutrition_pdf.py
```

**Cost estimate**: ~115 หน้า × ~4,000 tokens × $0.00025/1K ≈ **$0.12–0.20 total**

---

## Step 3: TypeScript Seed Script

**File**: `scripts/seed-moph2018.ts`

```typescript
import { readFileSync } from 'fs';
import { db } from '@/lib/db/client';
import { foods } from '@/lib/db/schema';

const allFoods = JSON.parse(readFileSync('scripts/extracted/all_foods.json', 'utf-8')) as Record<string, unknown>[];

function toNum(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n.toFixed(3);
}

async function main() {
  let inserted = 0,
    skipped = 0;

  for (const food of allFoods) {
    const id = String(food.food_id ?? '').trim();
    const nameTh = String(food.name_th ?? '').trim();
    if (!id || !nameTh) {
      skipped++;
      continue;
    }

    const kcal = Number(food.energy_kcal);
    if (!kcal || isNaN(kcal)) {
      skipped++;
      continue;
    }

    await db
      .insert(foods)
      .values({
        semanticId: `moph2018_${id}`,
        nameTh,
        nameEn: food.name_en ? String(food.name_en) : null,
        kcalPer100g: Math.round(kcal),
        proteinGPer100g: toNum(food.protein_g),
        carbGPer100g: toNum(food.carb_g),
        fatGPer100g: toNum(food.fat_g),
        waterGPer100g: toNum(food.water_g),
        fiberGPer100g: toNum(food.fiber_g),
        sugarGPer100g: toNum(food.sugar_g),
        ashGPer100g: toNum(food.ash_g),
        calciumMgPer100g: toNum(food.calcium_mg),
        phosphorusMgPer100g: toNum(food.phosphorus_mg),
        magnesiumMgPer100g: toNum(food.magnesium_mg),
        sodiumMgPer100g: toNum(food.sodium_mg),
        potassiumMgPer100g: toNum(food.potassium_mg),
        ironMgPer100g: toNum(food.iron_mg),
        copperMgPer100g: toNum(food.copper_mg),
        zincMgPer100g: toNum(food.zinc_mg),
        iodineUgPer100g: toNum(food.iodine_ug),
        vitaminAUgRaePer100g: toNum(food.vitamin_a_ug_rae),
        thiaminMgPer100g: toNum(food.thiamin_mg),
        riboflavinMgPer100g: toNum(food.riboflavin_mg),
        niacinMgPer100g: toNum(food.niacin_mg),
        vitaminCMgPer100g: toNum(food.vitamin_c_mg),
        vitaminEMgPer100g: toNum(food.vitamin_e_mg),
        source: 'thai_db',
        verified: true,
      })
      .onConflictDoUpdate({
        target: foods.semanticId,
        set: {
          nameTh,
          nameEn: food.name_en ? String(food.name_en) : null,
          kcalPer100g: Math.round(kcal),
          // repeat all fields...
          source: 'thai_db',
          verified: true,
        },
      });
    inserted++;
  }

  console.log(`Done: ${inserted} upserted, ${skipped} skipped`);
}

main().catch(console.error);
```

เพิ่มใน `package.json`:

```json
"db:seed:moph2018": "tsx scripts/seed-moph2018.ts"
```

---

## Critical Files

| File                                    | Action                                                 |
| --------------------------------------- | ------------------------------------------------------ |
| `lib/db/schema.ts`                      | เพิ่ม 18 nullable nutrient columns                     |
| `drizzle/migrations/`                   | auto-generated — commit ด้วย                           |
| `scripts/extract_thai_nutrition_pdf.py` | สร้างใหม่ — Python extraction                          |
| `scripts/seed-moph2018.ts`              | สร้างใหม่ — TypeScript DB upsert                       |
| `scripts/extracted/all_foods.json`      | generated — gitignore ได้ (82MB PDF อยู่ที่ root แล้ว) |
| `package.json`                          | เพิ่ม `db:seed:moph2018` script                        |

---

## Verification

```bash
# 1. Type-check หลัง schema extend
pnpm typecheck

# 2. ทดสอบ extract 1 หน้า (แก้ LAST_DATA_PAGE=8 ชั่วคราว)
python scripts/extract_thai_nutrition_pdf.py
cat scripts/extracted/page_008.json   # ดู JSON structure

# 3. Dry-run seed (เพิ่ม --dry-run flag หรือ console.log แทน db.insert)
tsx scripts/seed-moph2018.ts

# 4. รันจริง
pnpm db:seed:moph2018

# 5. ตรวจ DB
pnpm db:studio
# → ดู foods table, filter semanticId LIKE 'moph2018_%'

# 6. ทดสอบ search
# → เรียก searchByName('ข้าวเจ้า') ผ่าน repository หรือ db:studio
```

---

## Notes

- **semanticId prefix**: `moph2018_XXXXX` — ไม่ชนกับ `inmu_XXXXX` ของ BaoWio 2015
- **source**: `'thai_db'` + `verified: true` — precedence เหนือกว่า `llm_estimate`
- **Script is resumable**: cache แต่ละหน้าใน `scripts/extracted/page_NNN.json` — ถ้า crash รันใหม่ได้ไม่เสีย API call
- **ANTHROPIC_API_KEY**: ต้องมีใน environment ก่อนรัน Python script
