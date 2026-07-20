def find_duplicate_brand_conflicts(records: list) -> list:
    """Detect (category, product, brand) combinations that appear more than once
    in the records with different price_lbp values — these indicate duplicate rows
    in the source data where group_records_by_product() would silently keep only
    the last-seen price. Returns a list of warning dicts, empty if none found."""
    seen = {}
    warnings = []
    for r in records:
        key = (r["category"], r["product"], r["brand"])
        if key in seen and seen[key] != r["price_lbp"]:
            warnings.append({
                "category": r["category"],
                "product": r["product"],
                "brand": r["brand"],
                "conflicting_prices_lbp": [seen[key], r["price_lbp"]],
            })
        seen[key] = r["price_lbp"]
    return warnings


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


import argparse
import json
import os
import sys


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
    data_quality_warnings = find_duplicate_brand_conflicts(normalized["records"])

    result = {"meta": meta, "products": products, "categories": categories, "data_quality_warnings": data_quality_warnings}

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
    result = run_analysis(args.input_path, args.out)
    for w in result["data_quality_warnings"]:
        print(
            f"WARNING: duplicate row for {w['category']} / {w['product']} / {w['brand']} "
            f"has conflicting prices {w['conflicting_prices_lbp']} — kept the last one.",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
