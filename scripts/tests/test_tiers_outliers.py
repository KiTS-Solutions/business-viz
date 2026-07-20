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
