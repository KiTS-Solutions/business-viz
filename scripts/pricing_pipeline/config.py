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
