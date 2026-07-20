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
