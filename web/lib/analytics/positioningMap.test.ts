import { describe, it, expect } from "vitest";
import { buildCategoryPriceMap, filterCategoryPriceMap } from "./positioningMap";
import type { ProductAnalytics } from "../data/types";

function product(category: string, prices: Record<string, number>): ProductAnalytics {
  return {
    category,
    product: "Item",
    prices_lbp: prices,
    own_price_lbp: prices["Stories"] ?? null,
    competitor_avg_lbp: null,
    price_index: null,
    comparability: "low",
    tier: null,
    is_outlier: false,
    outlier_direction: null,
  };
}

describe("buildCategoryPriceMap", () => {
  it("averages per-brand prices within each category", () => {
    const rows = buildCategoryPriceMap([
      product("Hot", { Stories: 300000, "Espresso Lab": 350000 }),
      product("Hot", { Stories: 350000 }),
      product("Cold", { Stories: 200000 }),
    ]);

    const hot = rows.find((r) => r.category === "Hot")!;
    const storiesPoint = hot.brands.find((b) => b.brand === "Stories")!;
    expect(storiesPoint.avgPriceLbp).toBe(325000);
    expect(storiesPoint.productCount).toBe(2);

    const espressoPoint = hot.brands.find((b) => b.brand === "Espresso Lab")!;
    expect(espressoPoint.avgPriceLbp).toBe(350000);
    expect(espressoPoint.productCount).toBe(1);

    expect(rows.find((r) => r.category === "Cold")).toBeDefined();
  });

  it("sorts categories alphabetically", () => {
    const rows = buildCategoryPriceMap([product("Zebra", { Stories: 1 }), product("Alpha", { Stories: 1 })]);
    expect(rows.map((r) => r.category)).toEqual(["Alpha", "Zebra"]);
  });
});

describe("filterCategoryPriceMap", () => {
  it("returns all rows when category is null", () => {
    const rows = buildCategoryPriceMap([product("Hot", { Stories: 1 }), product("Cold", { Stories: 1 })]);
    expect(filterCategoryPriceMap(rows, null)).toHaveLength(2);
  });

  it("filters to one category when specified", () => {
    const rows = buildCategoryPriceMap([product("Hot", { Stories: 1 }), product("Cold", { Stories: 1 })]);
    expect(filterCategoryPriceMap(rows, "Hot")).toHaveLength(1);
  });
});
