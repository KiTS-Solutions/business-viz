import json
from pricing_pipeline.analyze_pricing import run_analysis, find_duplicate_brand_conflicts


def test_find_duplicate_brand_conflicts_detects_conflicts():
    """Test that conflicting prices for the same (category, product, brand) are detected."""
    records = [
        {"category": "Pastries", "product": "CHOCOLATE ÉCLAIR", "brand": "Espresso Lab", "price_lbp": 500000},
        {"category": "Pastries", "product": "CHOCOLATE ÉCLAIR", "brand": "Espresso Lab", "price_lbp": 400000},
    ]
    warnings = find_duplicate_brand_conflicts(records)

    assert len(warnings) == 1
    assert warnings[0]["category"] == "Pastries"
    assert warnings[0]["product"] == "CHOCOLATE ÉCLAIR"
    assert warnings[0]["brand"] == "Espresso Lab"
    assert warnings[0]["conflicting_prices_lbp"] == [500000, 400000]


def test_find_duplicate_brand_conflicts_no_false_positives():
    """Test that identical prices for the same (category, product, brand) are NOT flagged."""
    records = [
        {"category": "Pastries", "product": "CHOCOLATE ÉCLAIR", "brand": "Espresso Lab", "price_lbp": 400000},
        {"category": "Pastries", "product": "CHOCOLATE ÉCLAIR", "brand": "Espresso Lab", "price_lbp": 400000},
    ]
    warnings = find_duplicate_brand_conflicts(records)

    assert len(warnings) == 0


def test_find_duplicate_brand_conflicts_empty_list():
    """Test that no conflicts are detected when records are unique."""
    records = [
        {"category": "Hot", "product": "Americano", "brand": "Espresso Lab", "price_lbp": 400000},
        {"category": "Hot", "product": "Cappuccino", "brand": "Espresso Lab", "price_lbp": 450000},
    ]
    warnings = find_duplicate_brand_conflicts(records)

    assert len(warnings) == 0


def test_run_analysis_includes_data_quality_warnings(tmp_path):
    """Test that run_analysis output includes data_quality_warnings key."""
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

    assert "data_quality_warnings" in result
    assert isinstance(result["data_quality_warnings"], list)
    assert len(result["data_quality_warnings"]) == 0


def test_run_analysis_reports_conflicts_in_output(tmp_path):
    """Test that run_analysis includes detected conflicts in data_quality_warnings."""
    normalized = {
        "meta": {
            "client": "Stories",
            "own_brand": "Stories",
            "competitors": ["Espresso Lab"],
        },
        "records": [
            {"category": "Pastries", "product": "CHOCOLATE ÉCLAIR", "brand": "Stories", "price_lbp": 100000},
            {"category": "Pastries", "product": "CHOCOLATE ÉCLAIR", "brand": "Espresso Lab", "price_lbp": 500000},
            {"category": "Pastries", "product": "CHOCOLATE ÉCLAIR", "brand": "Espresso Lab", "price_lbp": 400000},
        ],
    }
    normalized_path = tmp_path / "normalized.json"
    normalized_path.write_text(json.dumps(normalized))
    output_path = tmp_path / "out" / "analytics.json"

    result = run_analysis(str(normalized_path), str(output_path))

    assert len(result["data_quality_warnings"]) == 1
    assert result["data_quality_warnings"][0]["product"] == "CHOCOLATE ÉCLAIR"
    assert result["data_quality_warnings"][0]["conflicting_prices_lbp"] == [500000, 400000]


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
