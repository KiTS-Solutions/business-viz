import { describe, it, expect } from "vitest";
import { prepareCategoryPositioning } from "./categoryPositioning";
import type { CategoryRollup } from "../data/types";

describe("prepareCategoryPositioning", () => {
  it("computes deviation from 100 and direction, excludes null-index categories, sorts descending", () => {
    const categories: CategoryRollup[] = [
      { category: "Hot", product_count: 5, countable_product_count: 5, avg_price_index: 120 },
      { category: "Cold", product_count: 3, countable_product_count: 3, avg_price_index: 85 },
      { category: "Empty", product_count: 1, countable_product_count: 0, avg_price_index: null },
      { category: "AtPar", product_count: 2, countable_product_count: 2, avg_price_index: 100 },
    ];

    const rows = prepareCategoryPositioning(categories);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ category: "Hot", avgIndex: 120, deviation: 20, direction: "above" });
    expect(rows.find((r) => r.category === "Cold")).toEqual({
      category: "Cold",
      avgIndex: 85,
      deviation: -15,
      direction: "below",
    });
    expect(rows.find((r) => r.category === "AtPar")?.direction).toBe("at-par");
  });
});
