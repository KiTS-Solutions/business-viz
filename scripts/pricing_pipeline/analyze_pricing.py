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
