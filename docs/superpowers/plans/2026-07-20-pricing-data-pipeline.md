# Pricing Data Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a config-driven Python pipeline that turns a raw pricing-comparison Excel file into a normalized dataset and then a full price-index/comparability/tier/outlier analytics JSON, ready for the dashboard (a separate plan) to consume.

**Architecture:** Two sequential CLI scripts. `parse_pricing.py` reads a raw `.xlsx` + a per-report JSON config and emits normalized `{category, product, brand, price_lbp, price_usd}` records. `analyze_pricing.py` reads that normalized JSON and computes the corrected price index (competitor average excludes the client's own brand), a comparability flag, category roll-ups, price tiers, and outlier flags, emitting the final analytics JSON the dashboard will render.

**Tech Stack:** Python 3.12, openpyxl (Excel reading), pytest (testing). No external services.

**Reference spec:** `docs/superpowers/specs/2026-07-20-stories-pricing-dashboard-design.md` — this plan implements spec §2-4 (data + pipeline). Dashboard/deployment (spec §5-8) is a separate plan.

## Global Constraints

- Currency: LBP is the primary figure everywhere in output data; `price_usd` is a derived secondary field only, computed as `price_lbp / fx_usd_rate`.
- FX rate is a per-source config value (`fx_usd_rate`, `fx_rate_date`, `fx_source`) — never hardcoded in pipeline code.
- Price index formula: `own_price ÷ competitor_only_average × 100` — the competitor average **excludes** the client's own brand (`own_brand` from config). This corrects the source file's flawed methodology (see spec §2).
- Comparability flag: `high` = 3+ competitors priced, `medium` = 2, `low` = 0 or 1.
- Outlier threshold default: `|price_index − 100| ≥ 15` (percentage points), and only applies to products with comparability `high` or `medium`.
- Pipeline code is generic/config-driven — no client-specific strings (brand names, categories) hardcoded anywhere in `scripts/pricing_pipeline/`.
- Repo layout: `raw-data/` (source Excel, committed), `sources/` (one config JSON per report, committed), `processed/` (generated JSON, committed as the dashboard's data contract), `scripts/pricing_pipeline/` (Python package).

---

### Task 1: Project Scaffold, Git Init, and Config Loader

**Files:**
- Create: `.gitignore`
- Create: `requirements.txt`
- Create: `pytest.ini`
- Create: `scripts/pricing_pipeline/__init__.py`
- Create: `scripts/pricing_pipeline/config.py`
- Create: `scripts/tests/__init__.py`
- Test: `scripts/tests/test_config.py`

**Interfaces:**
- Produces: `pricing_pipeline.config.load_source_config(path: str) -> dict`. Raises `ValueError` if any required key is missing. Required keys: `client`, `report_date`, `currency`, `fx_usd_rate`, `fx_rate_date`, `fx_source`, `own_brand`, `competitors`.

- [ ] **Step 1: Initialize git and .gitignore**

```bash
git init
```

Create `.gitignore`:
```
__pycache__/
*.pyc
.venv/
node_modules/
/out/
.next/
.~lock.*
.DS_Store
```

- [ ] **Step 2: Create Python venv and requirements.txt**

Create `requirements.txt`:
```
openpyxl>=3.1,<4
pytest>=8.0,<9
```

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

- [ ] **Step 3: Create package scaffold and pytest config**

Create `scripts/pricing_pipeline/__init__.py` (empty file).
Create `scripts/tests/__init__.py` (empty file).

Create `pytest.ini`:
```ini
[pytest]
pythonpath = scripts
testpaths = scripts/tests
```

- [ ] **Step 4: Write the failing test**

Create `scripts/tests/test_config.py`:
```python
import json
import pytest
from pricing_pipeline.config import load_source_config


def test_load_source_config_returns_dict(tmp_path):
    config_path = tmp_path / "stories.json"
    config_path.write_text(json.dumps({
        "client": "Stories",
        "report_date": "2026-03-01",
        "currency": "LBP",
        "fx_usd_rate": 89600,
        "fx_rate_date": "2026-07-20",
        "fx_source": "lira-rate.com / lbprate.com market average",
        "own_brand": "Stories",
        "competitors": ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"],
    }))

    config = load_source_config(str(config_path))

    assert config["client"] == "Stories"
    assert config["fx_usd_rate"] == 89600
    assert config["competitors"] == ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"]


def test_load_source_config_raises_on_missing_key(tmp_path):
    config_path = tmp_path / "incomplete.json"
    config_path.write_text(json.dumps({"client": "Stories"}))

    with pytest.raises(ValueError, match="missing required keys"):
        load_source_config(str(config_path))
```

- [ ] **Step 5: Run test, verify it fails**

Run: `pytest scripts/tests/test_config.py -v`
Expected: FAIL/ERROR — `ModuleNotFoundError: No module named 'pricing_pipeline.config'`

- [ ] **Step 6: Implement config.py**

Create `scripts/pricing_pipeline/config.py`:
```python
import json

REQUIRED_KEYS = [
    "client",
    "report_date",
    "currency",
    "fx_usd_rate",
    "fx_rate_date",
    "fx_source",
    "own_brand",
    "competitors",
]


def load_source_config(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        config = json.load(f)

    missing = [key for key in REQUIRED_KEYS if key not in config]
    if missing:
        raise ValueError(f"Source config {path} is missing required keys: {missing}")

    return config
```

- [ ] **Step 7: Run test, verify it passes**

Run: `pytest scripts/tests/test_config.py -v`
Expected: PASS (2 passed)

- [ ] **Step 8: Commit**

```bash
git add .gitignore requirements.txt pytest.ini scripts/ raw-data/ Branding/ docs/
git commit -m "chore: initial repo scaffold, config loader, existing raw data and branding assets"
```

---

### Task 2: Category Header Row Detection

**Files:**
- Create: `scripts/pricing_pipeline/parse_pricing.py`
- Test: `scripts/tests/test_category_header.py`

**Interfaces:**
- Consumes: nothing new.
- Produces: `pricing_pipeline.parse_pricing.is_category_header_row(row: tuple) -> bool`. `row` is a raw tuple as read by `openpyxl` (`Product`, `Stories`, competitor columns..., `Average`, `Difference`, ...). Returns `True` only when column 0 is non-empty and columns 1 through 7 are all `None` (the pattern used for category-header rows in the source workbook, confirmed against the real file: e.g. `('Black Coffee', None, None, None, None, None, None, None, None, None)`).

- [ ] **Step 1: Write the failing test**

Create `scripts/tests/test_category_header.py`:
```python
from pricing_pipeline.parse_pricing import is_category_header_row


def test_category_header_row_detected():
    row = ("Black Coffee", None, None, None, None, None, None, None, None, None)
    assert is_category_header_row(row) is True


def test_product_row_not_detected_as_header():
    row = ("Double Espresso Macchiato", 300000, "-", "-", "-", "-", 300000, 0, None, None)
    assert is_category_header_row(row) is False


def test_column_header_row_not_detected_as_category():
    row = ("Products Competitors", "Stories ", "Espresso Lab", "Dunkin Donuts",
           "Joe & the Juice", "Starbucks ", "Average", "Difference", None, None)
    assert is_category_header_row(row) is False


def test_empty_row_not_detected_as_category():
    row = (None,) * 10
    assert is_category_header_row(row) is False
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pytest scripts/tests/test_category_header.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'pricing_pipeline.parse_pricing'`

- [ ] **Step 3: Implement is_category_header_row**

Create `scripts/pricing_pipeline/parse_pricing.py`:
```python
def is_category_header_row(row: tuple) -> bool:
    product = row[0]
    rest = row[1:8]
    return product is not None and all(v is None for v in rest)
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pytest scripts/tests/test_category_header.py -v`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add scripts/pricing_pipeline/parse_pricing.py scripts/tests/test_category_header.py
git commit -m "feat: detect category header rows in raw pricing sheet"
```

---

### Task 3: Workbook Parsing to Normalized Records

**Files:**
- Modify: `scripts/pricing_pipeline/parse_pricing.py`
- Test: `scripts/tests/test_parse_workbook.py`

**Interfaces:**
- Consumes: `is_category_header_row(row) -> bool` (Task 2).
- Produces: `pricing_pipeline.parse_pricing.parse_workbook(xlsx_path: str, config: dict) -> dict`, returning `{"meta": {...}, "records": [...]}`. Each record: `{"category": str, "product": str, "brand": str, "price_lbp": int|float, "price_usd": float}`. Only brands with a numeric price produce a record — `'-'` and blank cells are skipped entirely (no null-valued records). `meta` contains: `client`, `report_date`, `currency`, `fx_usd_rate`, `fx_rate_date`, `fx_source`, `own_brand`, `competitors`, `generated_from` (the xlsx path passed in).

- [ ] **Step 1: Write the failing test**

Create `scripts/tests/test_parse_workbook.py`:
```python
import openpyxl
from pricing_pipeline.parse_pricing import parse_workbook


def _build_workbook(tmp_path):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Products Competitors", "Stories ", "Espresso Lab", "Dunkin Donuts",
               "Joe & the Juice", "Starbucks ", "Average", "Difference"])
    ws.append(["Black Coffee", None, None, None, None, None, None, None])
    ws.append(["Double Espresso Macchiato", 300000, "-", "-", "-", "-", 300000, 0])
    ws.append(["Americano MEDIUM", 350000, 400000, "-", 358000, 350000, 364500, -14500])
    path = tmp_path / "sample.xlsx"
    wb.save(path)
    return str(path)


def _config():
    return {
        "client": "Stories",
        "report_date": "2026-03-01",
        "currency": "LBP",
        "fx_usd_rate": 89600,
        "fx_rate_date": "2026-07-20",
        "fx_source": "test",
        "own_brand": "Stories",
        "competitors": ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"],
    }


def test_parse_workbook_skips_dashes_and_assigns_category(tmp_path):
    xlsx_path = _build_workbook(tmp_path)
    result = parse_workbook(xlsx_path, _config())

    macchiato = [r for r in result["records"] if r["product"] == "Double Espresso Macchiato"]
    assert len(macchiato) == 1
    assert macchiato[0]["brand"] == "Stories"
    assert macchiato[0]["price_lbp"] == 300000
    assert macchiato[0]["category"] == "Black Coffee"
    assert macchiato[0]["price_usd"] == 3.35


def test_parse_workbook_multiple_brands_per_product(tmp_path):
    xlsx_path = _build_workbook(tmp_path)
    result = parse_workbook(xlsx_path, _config())

    americano = [r for r in result["records"] if r["product"] == "Americano MEDIUM"]
    assert len(americano) == 4
    assert {r["brand"] for r in americano} == {"Stories", "Espresso Lab", "Joe & the Juice", "Starbucks"}


def test_parse_workbook_meta_fields(tmp_path):
    xlsx_path = _build_workbook(tmp_path)
    result = parse_workbook(xlsx_path, _config())

    assert result["meta"]["client"] == "Stories"
    assert result["meta"]["own_brand"] == "Stories"
    assert result["meta"]["generated_from"] == xlsx_path
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pytest scripts/tests/test_parse_workbook.py -v`
Expected: FAIL — `ImportError: cannot import name 'parse_workbook'`

- [ ] **Step 3: Implement parse_workbook**

Append to `scripts/pricing_pipeline/parse_pricing.py`:
```python
import openpyxl


def _clean(value):
    if isinstance(value, str):
        stripped = value.strip()
        return stripped if stripped else None
    return value


def parse_workbook(xlsx_path: str, config: dict) -> dict:
    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(min_row=1, max_row=ws.max_row, values_only=True))

    header = rows[0]
    brand_columns = [_clean(h) for h in header[1:6]]

    fx_rate = config["fx_usd_rate"]
    records = []
    current_category = None

    for row in rows[1:]:
        product = _clean(row[0])
        if product is None:
            continue

        if is_category_header_row(row):
            current_category = product
            continue

        for i, brand in enumerate(brand_columns):
            price = row[1 + i]
            if not isinstance(price, (int, float)):
                continue
            records.append({
                "category": current_category,
                "product": product,
                "brand": brand,
                "price_lbp": price,
                "price_usd": round(price / fx_rate, 2),
            })

    meta = {
        "client": config["client"],
        "report_date": config["report_date"],
        "currency": config["currency"],
        "fx_usd_rate": fx_rate,
        "fx_rate_date": config["fx_rate_date"],
        "fx_source": config["fx_source"],
        "own_brand": _clean(config["own_brand"]),
        "competitors": [_clean(c) for c in config["competitors"]],
        "generated_from": xlsx_path,
    }

    return {"meta": meta, "records": records}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pytest scripts/tests/test_parse_workbook.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add scripts/pricing_pipeline/parse_pricing.py scripts/tests/test_parse_workbook.py
git commit -m "feat: parse raw workbook into normalized price records"
```

---

### Task 4: Parse CLI Entrypoint + Real Stories Data Run

**Files:**
- Modify: `scripts/pricing_pipeline/parse_pricing.py`
- Create: `sources/stories-pricing-2026-03.json`
- Test: `scripts/tests/test_run_pipeline.py`

**Interfaces:**
- Consumes: `load_source_config` (Task 1), `parse_workbook` (Task 3).
- Produces: `pricing_pipeline.parse_pricing.run_pipeline(xlsx_path: str, config_path: str, output_path: str) -> dict` — writes the `parse_workbook` result as indented JSON to `output_path` and returns it. Also produces a `main(argv=None)` CLI entrypoint (`--xlsx`, `--config`, `--out`).

- [ ] **Step 1: Write the failing test**

Create `scripts/tests/test_run_pipeline.py`:
```python
import json
import openpyxl
from pricing_pipeline.parse_pricing import run_pipeline


def test_run_pipeline_writes_json_file(tmp_path):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Products Competitors", "Stories ", "Espresso Lab", "Dunkin Donuts",
               "Joe & the Juice", "Starbucks ", "Average", "Difference"])
    ws.append(["Black Coffee", None, None, None, None, None, None, None])
    ws.append(["Double Espresso Macchiato", 300000, "-", "-", "-", "-", 300000, 0])
    xlsx_path = tmp_path / "sample.xlsx"
    wb.save(xlsx_path)

    config_path = tmp_path / "config.json"
    config_path.write_text(json.dumps({
        "client": "Stories",
        "report_date": "2026-03-01",
        "currency": "LBP",
        "fx_usd_rate": 89600,
        "fx_rate_date": "2026-07-20",
        "fx_source": "test",
        "own_brand": "Stories",
        "competitors": ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"],
    }))

    output_path = tmp_path / "out" / "normalized.json"

    result = run_pipeline(str(xlsx_path), str(config_path), str(output_path))

    assert output_path.exists()
    on_disk = json.loads(output_path.read_text())
    assert on_disk == result
    assert len(result["records"]) == 1
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pytest scripts/tests/test_run_pipeline.py -v`
Expected: FAIL — `ImportError: cannot import name 'run_pipeline'`

- [ ] **Step 3: Implement run_pipeline and CLI**

Append to `scripts/pricing_pipeline/parse_pricing.py`:
```python
import argparse
import json
import os

from pricing_pipeline.config import load_source_config


def run_pipeline(xlsx_path: str, config_path: str, output_path: str) -> dict:
    config = load_source_config(config_path)
    result = parse_workbook(xlsx_path, config)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    return result


def _build_arg_parser():
    parser = argparse.ArgumentParser(description="Parse a raw pricing-comparison Excel file into normalized JSON.")
    parser.add_argument("--xlsx", required=True, help="Path to the raw Excel file")
    parser.add_argument("--config", required=True, help="Path to the source config JSON")
    parser.add_argument("--out", required=True, help="Path to write the normalized JSON")
    return parser


def main(argv=None):
    args = _build_arg_parser().parse_args(argv)
    run_pipeline(args.xlsx, args.config, args.out)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pytest scripts/tests/test_run_pipeline.py -v`
Expected: PASS (1 passed)

- [ ] **Step 5: Create the real Stories source config**

Create `sources/stories-pricing-2026-03.json`:
```json
{
  "client": "Stories",
  "report_date": "2026-03-01",
  "currency": "LBP",
  "fx_usd_rate": 89600,
  "fx_rate_date": "2026-07-20",
  "fx_source": "lira-rate.com / lbprate.com market average (parallel/market rate)",
  "own_brand": "Stories",
  "competitors": ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"]
}
```

- [ ] **Step 6: Run the pipeline against the real file**

```bash
python -m pricing_pipeline.parse_pricing \
  --xlsx "raw-data/Product Pricing Comparison March 2026 (1).xlsx" \
  --config sources/stories-pricing-2026-03.json \
  --out processed/stories-pricing-2026-03.normalized.json
```

Verify:
```bash
python -c "import json; d = json.load(open('processed/stories-pricing-2026-03.normalized.json')); print(len(d['records']))"
```
Expected: `803` (sum of per-brand priced counts confirmed during data exploration: Stories 310 + Espresso Lab 173 + Dunkin Donuts 85 + Joe & the Juice 102 + Starbucks 133).

- [ ] **Step 7: Commit**

```bash
git add scripts/pricing_pipeline/parse_pricing.py scripts/tests/test_run_pipeline.py sources/ processed/
git commit -m "feat: add parse CLI, run against real Stories March 2026 data"
```

---

### Task 5: Price Index and Comparability Calculation

**Files:**
- Create: `scripts/pricing_pipeline/analyze_pricing.py`
- Test: `scripts/tests/test_price_index.py`

**Interfaces:**
- Consumes: nothing new (pure functions over plain dicts/lists).
- Produces:
  - `pricing_pipeline.analyze_pricing.group_records_by_product(records: list) -> dict` — keys are `(category, product)` tuples, values are `{brand: price_lbp}`.
  - `pricing_pipeline.analyze_pricing.compute_competitor_average(prices: dict, own_brand: str, competitors: list) -> float | None`
  - `pricing_pipeline.analyze_pricing.compute_price_index(own_price, competitor_avg) -> float | None`
  - `pricing_pipeline.analyze_pricing.comparability_flag(num_competitors_priced: int) -> str` — returns `"high"`, `"medium"`, or `"low"`.

- [ ] **Step 1: Write the failing test**

Create `scripts/tests/test_price_index.py`:
```python
from pricing_pipeline.analyze_pricing import (
    group_records_by_product,
    compute_competitor_average,
    compute_price_index,
    comparability_flag,
)


def test_group_records_by_product():
    records = [
        {"category": "Hot", "product": "Americano MEDIUM", "brand": "Stories", "price_lbp": 350000},
        {"category": "Hot", "product": "Americano MEDIUM", "brand": "Espresso Lab", "price_lbp": 400000},
    ]
    grouped = group_records_by_product(records)
    assert grouped[("Hot", "Americano MEDIUM")] == {"Stories": 350000, "Espresso Lab": 400000}


def test_compute_competitor_average_excludes_own_brand():
    prices = {"Stories": 350000, "Espresso Lab": 400000, "Joe & the Juice": 358000, "Starbucks": 350000}
    competitors = ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"]

    avg = compute_competitor_average(prices, "Stories", competitors)

    assert round(avg, 2) == 369333.33


def test_compute_competitor_average_none_when_no_competitor_priced():
    prices = {"Stories": 350000}
    competitors = ["Espresso Lab", "Dunkin Donuts"]
    assert compute_competitor_average(prices, "Stories", competitors) is None


def test_compute_price_index_matches_corrected_methodology():
    index = compute_price_index(350000, 369333.33)
    assert index == 94.8


def test_compute_price_index_none_when_missing_inputs():
    assert compute_price_index(None, 369333.33) is None
    assert compute_price_index(350000, None) is None


def test_comparability_flag_thresholds():
    assert comparability_flag(3) == "high"
    assert comparability_flag(4) == "high"
    assert comparability_flag(2) == "medium"
    assert comparability_flag(1) == "low"
    assert comparability_flag(0) == "low"
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pytest scripts/tests/test_price_index.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'pricing_pipeline.analyze_pricing'`

- [ ] **Step 3: Implement analyze_pricing.py**

Create `scripts/pricing_pipeline/analyze_pricing.py`:
```python
def group_records_by_product(records: list) -> dict:
    grouped = {}
    for r in records:
        key = (r["category"], r["product"])
        grouped.setdefault(key, {})[r["brand"]] = r["price_lbp"]
    return grouped


def compute_competitor_average(prices: dict, own_brand: str, competitors: list):
    values = [prices[c] for c in competitors if prices.get(c) is not None]
    if not values:
        return None
    return sum(values) / len(values)


def compute_price_index(own_price, competitor_avg):
    if own_price is None or competitor_avg is None or competitor_avg == 0:
        return None
    return round((own_price / competitor_avg) * 100, 1)


def comparability_flag(num_competitors_priced: int) -> str:
    if num_competitors_priced >= 3:
        return "high"
    if num_competitors_priced == 2:
        return "medium"
    return "low"
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pytest scripts/tests/test_price_index.py -v`
Expected: PASS (6 passed)

- [ ] **Step 5: Commit**

```bash
git add scripts/pricing_pipeline/analyze_pricing.py scripts/tests/test_price_index.py
git commit -m "feat: compute corrected competitor-only price index and comparability flag"
```

---

### Task 6: Product Analytics and Category Roll-ups

**Files:**
- Modify: `scripts/pricing_pipeline/analyze_pricing.py`
- Test: `scripts/tests/test_rollups.py`

**Interfaces:**
- Consumes: `group_records_by_product`, `compute_competitor_average`, `compute_price_index`, `comparability_flag` (Task 5).
- Produces:
  - `pricing_pipeline.analyze_pricing.build_product_analytics(records: list, own_brand: str, competitors: list) -> list[dict]` — one dict per `(category, product)` with keys `category`, `product`, `prices_lbp`, `own_price_lbp`, `competitor_avg_lbp`, `price_index`, `comparability`.
  - `pricing_pipeline.analyze_pricing.build_category_rollups(products: list) -> list[dict]` — one dict per category with `category`, `product_count`, `countable_product_count`, `avg_price_index` (averaged only over `high`/`medium` comparability products with a non-null index).

- [ ] **Step 1: Write the failing test**

Create `scripts/tests/test_rollups.py`:
```python
from pricing_pipeline.analyze_pricing import build_product_analytics, build_category_rollups


def _records():
    return [
        # Americano MEDIUM: high comparability (3 competitors priced)
        {"category": "Hot", "product": "Americano MEDIUM", "brand": "Stories", "price_lbp": 350000},
        {"category": "Hot", "product": "Americano MEDIUM", "brand": "Espresso Lab", "price_lbp": 400000},
        {"category": "Hot", "product": "Americano MEDIUM", "brand": "Joe & the Juice", "price_lbp": 358000},
        {"category": "Hot", "product": "Americano MEDIUM", "brand": "Starbucks", "price_lbp": 350000},
        # Decaf Espresso: low comparability (0 competitors priced against Stories — Stories has no price)
        {"category": "Hot", "product": "Decaf Espresso", "brand": "Dunkin Donuts", "price_lbp": 270000},
    ]


def test_build_product_analytics_computes_index_and_comparability():
    products = build_product_analytics(_records(), "Stories", ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"])

    americano = next(p for p in products if p["product"] == "Americano MEDIUM")
    assert americano["own_price_lbp"] == 350000
    assert americano["comparability"] == "high"
    assert americano["price_index"] == 94.8

    decaf = next(p for p in products if p["product"] == "Decaf Espresso")
    assert decaf["own_price_lbp"] is None
    assert decaf["price_index"] is None
    assert decaf["comparability"] == "low"


def test_build_category_rollups_excludes_low_comparability():
    products = build_product_analytics(_records(), "Stories", ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"])
    rollups = build_category_rollups(products)

    hot = next(r for r in rollups if r["category"] == "Hot")
    assert hot["product_count"] == 2
    assert hot["countable_product_count"] == 1
    assert hot["avg_price_index"] == 94.8
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pytest scripts/tests/test_rollups.py -v`
Expected: FAIL — `ImportError: cannot import name 'build_product_analytics'`

- [ ] **Step 3: Implement build_product_analytics and build_category_rollups**

Append to `scripts/pricing_pipeline/analyze_pricing.py`:
```python
def build_product_analytics(records: list, own_brand: str, competitors: list) -> list:
    grouped = group_records_by_product(records)
    products = []
    for (category, product), prices in grouped.items():
        own_price = prices.get(own_brand)
        competitor_avg = compute_competitor_average(prices, own_brand, competitors)
        num_priced = sum(1 for c in competitors if prices.get(c) is not None)
        products.append({
            "category": category,
            "product": product,
            "prices_lbp": prices,
            "own_price_lbp": own_price,
            "competitor_avg_lbp": round(competitor_avg, 2) if competitor_avg is not None else None,
            "price_index": compute_price_index(own_price, competitor_avg),
            "comparability": comparability_flag(num_priced),
        })
    return products


def build_category_rollups(products: list) -> list:
    by_category = {}
    for p in products:
        by_category.setdefault(p["category"], []).append(p)

    rollups = []
    for category, items in by_category.items():
        countable = [p for p in items if p["comparability"] in ("high", "medium") and p["price_index"] is not None]
        avg_index = round(sum(p["price_index"] for p in countable) / len(countable), 1) if countable else None
        rollups.append({
            "category": category,
            "product_count": len(items),
            "countable_product_count": len(countable),
            "avg_price_index": avg_index,
        })
    return rollups
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pytest scripts/tests/test_rollups.py -v`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add scripts/pricing_pipeline/analyze_pricing.py scripts/tests/test_rollups.py
git commit -m "feat: build per-product analytics and category roll-ups"
```

---

### Task 7: Price Tiers and Outlier Flagging

**Files:**
- Modify: `scripts/pricing_pipeline/analyze_pricing.py`
- Test: `scripts/tests/test_tiers_outliers.py`

**Interfaces:**
- Consumes: the `products` list shape produced by `build_product_analytics` (Task 6) — specifically `category`, `own_price_lbp`, `price_index`, `comparability`.
- Produces:
  - `pricing_pipeline.analyze_pricing.assign_price_tiers(products: list) -> None` — mutates each product dict in place, adding `tier` (`"Value"`, `"Core"`, `"Premium"`, or `None` if fewer than 4 priced Stories items exist in that category or the product itself has no `own_price_lbp`).
  - `pricing_pipeline.analyze_pricing.flag_outliers(products: list, threshold: float = 15.0) -> None` — mutates each product dict in place, adding `is_outlier` (bool) and `outlier_direction` (`"overpriced"`, `"underpriced"`, or `None`).

- [ ] **Step 1: Write the failing test**

Create `scripts/tests/test_tiers_outliers.py`:
```python
from pricing_pipeline.analyze_pricing import assign_price_tiers, flag_outliers


def _priced_products(prices):
    return [
        {"category": "Hot", "product": f"Item {i}", "own_price_lbp": price,
         "price_index": 100.0, "comparability": "high"}
        for i, price in enumerate(prices)
    ]


def test_assign_price_tiers_low_and_high_ends():
    products = _priced_products([100, 200, 300, 400, 500, 600, 700, 800])
    assign_price_tiers(products)

    assert products[0]["tier"] == "Value"    # price 100, lowest
    assert products[-1]["tier"] == "Premium"  # price 800, highest
    assert products[3]["tier"] == "Core"      # price 400, mid-range


def test_assign_price_tiers_none_when_too_few_products():
    products = _priced_products([100, 200])
    assign_price_tiers(products)
    assert all(p["tier"] is None for p in products)


def test_flag_outliers_overpriced_and_underpriced():
    products = [
        {"price_index": 120.0, "comparability": "high"},
        {"price_index": 80.0, "comparability": "medium"},
        {"price_index": 105.0, "comparability": "high"},
        {"price_index": 130.0, "comparability": "low"},
    ]
    flag_outliers(products)

    assert products[0]["is_outlier"] is True
    assert products[0]["outlier_direction"] == "overpriced"
    assert products[1]["is_outlier"] is True
    assert products[1]["outlier_direction"] == "underpriced"
    assert products[2]["is_outlier"] is False
    assert products[2]["outlier_direction"] is None
    assert products[3]["is_outlier"] is False  # low comparability never flagged, despite large deviation
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pytest scripts/tests/test_tiers_outliers.py -v`
Expected: FAIL — `ImportError: cannot import name 'assign_price_tiers'`

- [ ] **Step 3: Implement assign_price_tiers and flag_outliers**

Append to `scripts/pricing_pipeline/analyze_pricing.py`:
```python
import statistics


def assign_price_tiers(products: list) -> None:
    by_category = {}
    for p in products:
        if p["own_price_lbp"] is not None:
            by_category.setdefault(p["category"], []).append(p["own_price_lbp"])

    bounds_by_category = {}
    for category, prices in by_category.items():
        if len(prices) < 4:
            bounds_by_category[category] = None
            continue
        sorted_prices = sorted(prices)
        q1, _, q3 = statistics.quantiles(sorted_prices, n=4)
        bounds_by_category[category] = (q1, q3)

    for p in products:
        bounds = bounds_by_category.get(p["category"])
        price = p["own_price_lbp"]
        if bounds is None or price is None:
            p["tier"] = None
            continue
        q1, q3 = bounds
        if price <= q1:
            p["tier"] = "Value"
        elif price >= q3:
            p["tier"] = "Premium"
        else:
            p["tier"] = "Core"


def flag_outliers(products: list, threshold: float = 15.0) -> None:
    for p in products:
        index = p["price_index"]
        if index is None or p["comparability"] == "low":
            p["is_outlier"] = False
            p["outlier_direction"] = None
            continue
        deviation = index - 100
        if abs(deviation) >= threshold:
            p["is_outlier"] = True
            p["outlier_direction"] = "overpriced" if deviation > 0 else "underpriced"
        else:
            p["is_outlier"] = False
            p["outlier_direction"] = None
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pytest scripts/tests/test_tiers_outliers.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add scripts/pricing_pipeline/analyze_pricing.py scripts/tests/test_tiers_outliers.py
git commit -m "feat: assign price tiers and flag repricing outliers"
```

---

### Task 8: Analyze CLI Entrypoint + Real Stories Analytics Run

**Files:**
- Modify: `scripts/pricing_pipeline/analyze_pricing.py`
- Test: `scripts/tests/test_run_analysis.py`

**Interfaces:**
- Consumes: `build_product_analytics`, `build_category_rollups`, `assign_price_tiers`, `flag_outliers` (Tasks 5-7); reads the normalized JSON shape produced by `parse_workbook`/`run_pipeline` (Tasks 3-4) — specifically `meta.own_brand`, `meta.competitors`, and `records`.
- Produces: `pricing_pipeline.analyze_pricing.run_analysis(normalized_json_path: str, output_path: str) -> dict` — writes `{"meta": ..., "products": [...], "categories": [...]}` to `output_path`. Also a `main(argv=None)` CLI entrypoint (`--in`, `--out`).

- [ ] **Step 1: Write the failing test**

Create `scripts/tests/test_run_analysis.py`:
```python
import json
from pricing_pipeline.analyze_pricing import run_analysis


def test_run_analysis_writes_full_analytics_json(tmp_path):
    normalized = {
        "meta": {
            "client": "Stories",
            "own_brand": "Stories",
            "competitors": ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"],
        },
        "records": [
            {"category": "Hot", "product": "Americano MEDIUM", "brand": "Stories", "price_lbp": 350000},
            {"category": "Hot", "product": "Americano MEDIUM", "brand": "Espresso Lab", "price_lbp": 400000},
            {"category": "Hot", "product": "Americano MEDIUM", "brand": "Joe & the Juice", "price_lbp": 358000},
            {"category": "Hot", "product": "Americano MEDIUM", "brand": "Starbucks", "price_lbp": 350000},
        ],
    }
    normalized_path = tmp_path / "normalized.json"
    normalized_path.write_text(json.dumps(normalized))
    output_path = tmp_path / "out" / "analytics.json"

    result = run_analysis(str(normalized_path), str(output_path))

    assert output_path.exists()
    assert result["meta"]["client"] == "Stories"
    assert len(result["products"]) == 1
    assert result["products"][0]["price_index"] == 94.8
    assert len(result["categories"]) == 1
    assert result["categories"][0]["category"] == "Hot"
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pytest scripts/tests/test_run_analysis.py -v`
Expected: FAIL — `ImportError: cannot import name 'run_analysis'`

- [ ] **Step 3: Implement run_analysis and CLI**

Append to `scripts/pricing_pipeline/analyze_pricing.py`:
```python
import argparse
import json
import os


def run_analysis(normalized_json_path: str, output_path: str) -> dict:
    with open(normalized_json_path, "r", encoding="utf-8") as f:
        normalized = json.load(f)

    meta = normalized["meta"]
    own_brand = meta["own_brand"]
    competitors = meta["competitors"]

    products = build_product_analytics(normalized["records"], own_brand, competitors)
    assign_price_tiers(products)
    flag_outliers(products)
    categories = build_category_rollups(products)

    result = {"meta": meta, "products": products, "categories": categories}

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    return result


def _build_analysis_arg_parser():
    parser = argparse.ArgumentParser(description="Analyze normalized pricing JSON into indices, tiers, and outliers.")
    parser.add_argument("--in", dest="input_path", required=True, help="Path to the normalized JSON")
    parser.add_argument("--out", required=True, help="Path to write the analytics JSON")
    return parser


def main(argv=None):
    args = _build_analysis_arg_parser().parse_args(argv)
    run_analysis(args.input_path, args.out)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run test, verify it passes**

Run: `pytest scripts/tests/test_run_analysis.py -v`
Expected: PASS (1 passed)

- [ ] **Step 5: Run the full test suite**

Run: `pytest -v`
Expected: all tests across every task pass (24 passed).

- [ ] **Step 6: Run the analyzer against the real Stories normalized data**

```bash
python -m pricing_pipeline.analyze_pricing \
  --in processed/stories-pricing-2026-03.normalized.json \
  --out processed/stories-pricing-2026-03.json
```

Verify:
```bash
python -c "
import json
d = json.load(open('processed/stories-pricing-2026-03.json'))
print('products:', len(d['products']))
print('categories:', len(d['categories']))
print('outliers:', sum(1 for p in d['products'] if p['is_outlier']))
"
```
Expected: `products: 591`, `categories: 24`, and some non-zero outlier count (exact count depends on real data distribution — sanity-check it's neither 0 nor implausibly close to 591).

- [ ] **Step 7: Commit**

```bash
git add scripts/pricing_pipeline/analyze_pricing.py scripts/tests/test_run_analysis.py processed/
git commit -m "feat: add analyze CLI, run full analytics against real Stories March 2026 data"
```

---

## Definition of Done

- `pytest -v` from repo root passes with 0 failures.
- `processed/stories-pricing-2026-03.json` exists, committed, containing 591 products across 24 categories with `price_index`, `comparability`, `tier`, and `is_outlier` populated per the corrected (competitor-only-average) methodology.
- `sources/stories-pricing-2026-03.json` exists and is the only client-specific file in the whole pipeline — `scripts/pricing_pipeline/` contains zero hardcoded brand/category names.
- This analytics JSON is the data contract the dashboard plan consumes — its shape (`meta`, `products[]`, `categories[]`) must not change without updating the dashboard plan.
