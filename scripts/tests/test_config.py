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
