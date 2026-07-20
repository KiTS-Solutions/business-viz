import { describe, it, expect } from "vitest";
import { searchProducts } from "./explorer";
import type { ProductAnalytics } from "../data/types";

function product(category: string, name: string): ProductAnalytics {
  return {
    category,
    product: name,
    prices_lbp: {},
    own_price_lbp: 100000,
    competitor_avg_lbp: 100000,
    price_index: 100,
    comparability: "high",
    tier: "Core",
    is_outlier: false,
    outlier_direction: null,
  };
}

describe("searchProducts", () => {
  const products = [product("Black Coffee", "Americano MEDIUM"), product("Pastries", "Croissant")];

  it("returns all products for an empty query", () => {
    expect(searchProducts(products, "")).toHaveLength(2);
  });

  it("matches by product name, case-insensitive", () => {
    expect(searchProducts(products, "americano")).toEqual([products[0]]);
  });

  it("matches by category name", () => {
    expect(searchProducts(products, "pastries")).toEqual([products[1]]);
  });
});
