def is_category_header_row(row: tuple) -> bool:
    product = row[0]
    rest = row[1:8]
    return product is not None and all(v is None for v in rest)


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

    # Locate "Average" column to determine the actual brand column span
    average_col_index = None
    for i, col_header in enumerate(header):
        if _clean(col_header) == "Average":
            average_col_index = i
            break

    if average_col_index is None:
        raise ValueError(
            "Could not locate the 'Average' column in the header row — "
            "sheet layout does not match the expected template."
        )

    # Extract the FULL actual set of brand columns from the file
    brand_columns = [_clean(h) for h in header[1:average_col_index]]

    # Validate that header brands match config brands (bidirectional check)
    expected_brands = {_clean(config["own_brand"]), *[_clean(c) for c in config["competitors"]]}
    actual_brands = set(brand_columns)

    if actual_brands != expected_brands:
        missing = expected_brands - actual_brands
        extra = actual_brands - expected_brands
        raise ValueError(
            f"Header brand columns {brand_columns} do not match config's expected brands "
            f"(own_brand + competitors). Missing from header: {sorted(missing) or 'none'}. "
            f"Present in header but not in config: {sorted(extra) or 'none'}."
        )

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
