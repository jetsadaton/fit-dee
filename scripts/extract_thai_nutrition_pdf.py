#!/usr/bin/env python3
"""
Extract nutritional data from ตารางคุณค่า 2018.pdf.pdf using Kimi K2.6 vision.

Manager mode (no args):  spawns 20 worker subprocesses with fixed page ranges.
Worker mode (--start N --end N): processes its assigned pages, one at a time.

Page assignment (97 pages → 20 workers):
  W01: 26–30   W02: 31–35   W03: 36–40   W04: 41–45   W05: 46–50
  W06: 51–55   W07: 56–60   W08: 61–65   W09: 66–70   W10: 71–75
  W11: 76–80   W12: 81–85   W13: 86–90   W14: 91–95   W15: 96–100
  W16: 101–105 W17: 106–110 W18: 111–114 W19: 115–118 W20: 119–122

Requirements:
  uv venv scripts/.venv
  uv pip install --python scripts/.venv/bin/python pdf2image openai
  brew install poppler   # macOS

Run:
  KIMI_API_KEY=sk-... scripts/.venv/bin/python scripts/extract_thai_nutrition_pdf.py
"""
import argparse, base64, io, json, os, subprocess, sys, time
from pathlib import Path
from pdf2image import convert_from_path
from openai import OpenAI

PDF_PATH        = "ตารางคุณค่า 2018.pdf.pdf"
OUTPUT_DIR      = Path("scripts/extracted")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

FIRST_DATA_PAGE = 26
LAST_DATA_PAGE  = 122
NUM_WORKERS     = 10
MAX_RETRIES     = 3
RETRY_DELAY     = 10  # seconds on rate-limit / empty response
WORKER_STAGGER  = 2   # seconds between worker subprocess launches (spread API burst)

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


# ---------------------------------------------------------------------------
# Helpers (shared by worker and manager)
# ---------------------------------------------------------------------------

def make_batches(start: int, end: int, n: int) -> list[tuple[int, int]]:
    """Divide [start, end] into n roughly-equal batches. Returns list of (s, e)."""
    pages = list(range(start, end + 1))
    size, rem = divmod(len(pages), n)
    batches: list[tuple[int, int]] = []
    i = 0
    for w in range(n):
        bs = size + (1 if w < rem else 0)
        batches.append((pages[i], pages[i + bs - 1]))
        i += bs
    return batches


def img_to_b64(img) -> str:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.standard_b64encode(buf.getvalue()).decode()


def parse_rows(raw: str, page_num: int) -> list[dict]:
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        rows = json.loads(raw.strip())
        return rows if isinstance(rows, list) else []
    except json.JSONDecodeError:
        print(f"[page {page_num}] JSON parse error: {raw[:80]!r}", flush=True)
        return []


# ---------------------------------------------------------------------------
# Worker mode: process a fixed page range sequentially
# ---------------------------------------------------------------------------

def extract_page(client: OpenAI, page_num: int, worker_id: int) -> list[dict]:
    tag = f"[W{worker_id:02d}|p{page_num}]"

    cache_file = OUTPUT_DIR / f"page_{page_num:03d}.json"
    if cache_file.exists():
        data = json.loads(cache_file.read_text())
        print(f"{tag} cache — {len(data)} rows", flush=True)
        return data

    # Convert only this page (avoids loading all pages into memory)
    images = convert_from_path(PDF_PATH, first_page=page_num, last_page=page_num, dpi=150)
    if not images:
        print(f"{tag} PDF convert returned nothing", flush=True)
        return []

    b64 = img_to_b64(images[0])
    del images

    print(f"{tag} calling Kimi…", flush=True)
    raw = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = client.chat.completions.create(
                model="moonshot-v1-32k-vision-preview",
                max_tokens=8192,
                messages=[{"role": "user", "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                    {"type": "text", "text": EXTRACT_PROMPT},
                ]}],
            )
            raw = resp.choices[0].message.content.strip()
            if raw:
                break
            raw = None
            print(f"{tag} empty response (attempt {attempt}/{MAX_RETRIES})", flush=True)
        except Exception as e:
            print(f"{tag} API error attempt {attempt}/{MAX_RETRIES}: {e}", flush=True)
            raw = None

        if attempt < MAX_RETRIES:
            print(f"{tag} retrying in {RETRY_DELAY}s…", flush=True)
            time.sleep(RETRY_DELAY)

    if raw is None:
        print(f"{tag} all retries exhausted — skipping", flush=True)
        return []

    rows = parse_rows(raw, page_num)
    cache_file.write_text(json.dumps(rows, ensure_ascii=False, indent=2))
    print(f"{tag} done — {len(rows)} rows", flush=True)
    return rows


def worker_mode(start: int, end: int, worker_id: int) -> None:
    api_key = os.environ.get("KIMI_API_KEY", "")
    if not api_key:
        raise SystemExit("KIMI_API_KEY not set")

    client = OpenAI(api_key=api_key, base_url="https://api.moonshot.ai/v1")
    total = 0
    for page_num in range(start, end + 1):
        rows = extract_page(client, page_num, worker_id)
        total += len(rows)

    print(f"[W{worker_id:02d}] finished pages {start}–{end} ({total} rows total)", flush=True)


# ---------------------------------------------------------------------------
# Manager mode: show assignment table, spawn 20 worker subprocesses, merge
# ---------------------------------------------------------------------------

def manager_mode() -> None:
    api_key = os.environ.get("KIMI_API_KEY", "")
    if not api_key:
        raise SystemExit("KIMI_API_KEY not set")

    batches = make_batches(FIRST_DATA_PAGE, LAST_DATA_PAGE, NUM_WORKERS)
    total_pages = LAST_DATA_PAGE - FIRST_DATA_PAGE + 1

    # Print assignment table
    print(f"\n{'='*55}")
    print(f"  Thai Nutrition Extractor — {total_pages} pages → {NUM_WORKERS} workers")
    print(f"{'='*55}")
    print(f"  {'Worker':<8} {'Pages':<12} {'Count':<7} {'Cached':<10} {'Pending'}")
    print(f"  {'-'*52}")
    for i, (s, e) in enumerate(batches, 1):
        count  = e - s + 1
        cached = sum(1 for p in range(s, e+1) if (OUTPUT_DIR / f"page_{p:03d}.json").exists())
        print(f"  W{i:02d}     {s:>3}–{e:<3}      {count:<7} {cached}/{count:<8} {count-cached}")
    print(f"{'='*55}\n")

    # Spawn 20 worker subprocesses
    python = sys.executable
    script = str(Path(__file__).resolve())
    procs: list[tuple[int, int, int, subprocess.Popen]] = []

    for i, (s, e) in enumerate(batches, 1):
        proc = subprocess.Popen(
            [python, script, "--start", str(s), "--end", str(e), "--worker-id", str(i)],
            env={**os.environ, "KIMI_API_KEY": api_key},
        )
        print(f"  Launched W{i:02d}: pages {s}–{e}  (pid {proc.pid})", flush=True)
        procs.append((i, s, e, proc))
        if i < len(batches):
            time.sleep(WORKER_STAGGER)  # stagger launches to avoid API burst

    print(f"\nAll {NUM_WORKERS} workers launched. Waiting…\n")

    # Wait for all and collect exit codes
    failed: list[tuple[int, int, int]] = []
    for i, s, e, proc in procs:
        rc = proc.wait()
        status = "OK  " if rc == 0 else f"FAIL (exit {rc})"
        print(f"  W{i:02d} pages {s}–{e}: {status}", flush=True)
        if rc != 0:
            failed.append((i, s, e))

    # Merge all cached results in page order
    all_rows: list[dict] = []
    for p in range(FIRST_DATA_PAGE, LAST_DATA_PAGE + 1):
        cf = OUTPUT_DIR / f"page_{p:03d}.json"
        if cf.exists():
            all_rows.extend(json.loads(cf.read_text()))

    out = OUTPUT_DIR / "all_foods.json"
    out.write_text(json.dumps(all_rows, ensure_ascii=False, indent=2))

    print(f"\n{'='*55}")
    print(f"  Done! {len(all_rows)} foods → {out}")
    if failed:
        failed_ids = ", ".join(f"W{i:02d}(p{s}–{e})" for i, s, e in failed)
        print(f"  WARNING: {len(failed)} failed workers: {failed_ids}")
        print(f"  Re-run to retry — cached pages will be skipped automatically.")
    print(f"{'='*55}\n")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Thai Nutrition PDF extractor")
    parser.add_argument("--start",     type=int, help="First page (worker mode)")
    parser.add_argument("--end",       type=int, help="Last page (worker mode)")
    parser.add_argument("--worker-id", type=int, default=0, help="Worker number for log prefix")
    args = parser.parse_args()

    if args.start is not None and args.end is not None:
        worker_mode(args.start, args.end, args.worker_id)
    else:
        manager_mode()


if __name__ == "__main__":
    main()
