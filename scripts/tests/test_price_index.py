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
