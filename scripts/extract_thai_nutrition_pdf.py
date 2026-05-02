#!/usr/bin/env python3
"""
Extract nutritional data from ตารางคุณค่า 2018.pdf.pdf using Kimi K2.6 vision.
Output: scripts/extracted/all_foods.json

Requirements:
  uv venv scripts/.venv
  uv pip install --python scripts/.venv/bin/python pdf2image openai
  brew install poppler   # macOS

Run:
  scripts/.venv/bin/python scripts/extract_thai_nutrition_pdf.py
"""
import base64, io, json, os, time
from pathlib import Path
from pdf2image import convert_from_path
from openai import OpenAI

PDF_PATH = "ตารางคุณค่า 2018.pdf.pdf"
OUTPUT_DIR = Path("scripts/extracted")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FIRST_DATA_PAGE = 26   # หน้าแรกที่มีตารางอาหาร (จากการทดสอบ)
LAST_DATA_PAGE  = 122

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
- ตัวเลขในวงเล็บ เช่น "(350)" = ค่าประมาณ ใช้ตัวเลขนั้นได้เลย
- ถ้าหน้านี้ไม่มีตารางข้อมูลอาหาร ให้ตอบ []
- ตอบเฉพาะ JSON array เท่านั้น ห้ามอธิบาย"""

client = OpenAI(
    api_key=os.environ.get("KIMI_API_KEY", ""),
    base_url="https://api.moonshot.ai/v1",
)


def img_to_b64(img) -> str:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.standard_b64encode(buf.getvalue()).decode()


def extract_page(page_num: int, img) -> list[dict]:
    cache_file = OUTPUT_DIR / f"page_{page_num:03d}.json"
    if cache_file.exists():
        print(f"  [cache] page {page_num}")
        return json.loads(cache_file.read_text())

    print(f"  [api]   page {page_num}", flush=True)

    try:
        response = client.chat.completions.create(
            model="kimi-k2.6",
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img_to_b64(img)}"
                            },
                        },
                        {"type": "text", "text": EXTRACT_PROMPT},
                    ],
                }
            ],
        )
        raw = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"  [warn] API error page {page_num}: {e}", flush=True)
        time.sleep(2)
        return []

    # strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    # Don't cache on parse errors — let next run retry the page
    if not raw.strip():
        print(f"  [warn] empty response page {page_num}, will retry", flush=True)
        time.sleep(2)
        return []

    try:
        rows = json.loads(raw.strip())
        if not isinstance(rows, list):
            print(f"  [warn] non-list response page {page_num}: {raw[:60]!r}, will retry", flush=True)
            time.sleep(1)
            return []
    except json.JSONDecodeError:
        print(f"  [warn] parse error page {page_num}: {raw[:80]!r}, will retry", flush=True)
        time.sleep(1)
        return []

    cache_file.write_text(json.dumps(rows, ensure_ascii=False, indent=2))
    time.sleep(0.5)
    return rows


def main():
    api_key = os.environ.get("KIMI_API_KEY", "")
    if not api_key:
        raise SystemExit("KIMI_API_KEY not set")

    print(f"Converting PDF pages {FIRST_DATA_PAGE}–{LAST_DATA_PAGE}...")
    pages = convert_from_path(
        PDF_PATH,
        first_page=FIRST_DATA_PAGE,
        last_page=LAST_DATA_PAGE,
        dpi=150,
    )
    print(f"Got {len(pages)} page images. Extracting via Kimi K2.6...")

    all_rows: list[dict] = []
    for i, img in enumerate(pages):
        page_num = FIRST_DATA_PAGE + i
        rows = extract_page(page_num, img)
        all_rows.extend(rows)
        print(f"    → {len(rows)} rows (total so far: {len(all_rows)})", flush=True)

    out = OUTPUT_DIR / "all_foods.json"
    out.write_text(json.dumps(all_rows, ensure_ascii=False, indent=2))
    print(f"\nDone! {len(all_rows)} foods → {out}")


if __name__ == "__main__":
    main()
