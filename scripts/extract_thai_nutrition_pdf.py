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
