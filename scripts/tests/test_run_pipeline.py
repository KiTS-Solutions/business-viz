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
