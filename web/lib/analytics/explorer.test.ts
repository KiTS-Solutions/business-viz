import { describe, it, expect } from "vitest";
import { searchProducts, filterProducts, sortProducts, uniqueCategories, paginate } from "./explorer";
import type { ProductAnalytics } from "../data/types";

function product(category: string, name: string, overrides: Partial<ProductAnalytics> = {}): ProductAnalytics {
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
    ...overrides,
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

describe("filterProducts", () => {
  const products = [
    product("Hot", "A", { comparability: "high", is_outlier: false }),
    product("Hot", "B", { comparability: "low", is_outlier: true }),
    product("Cold", "C", { comparability: "medium", is_outlier: false }),
  ];

  it("filters by category", () => {
    const result = filterProducts(products, { category: "Cold", comparability: null, outliersOnly: false });
    expect(result).toEqual([products[2]]);
  });

  it("filters by comparability", () => {
    const result = filterProducts(products, { category: null, comparability: "low", outliersOnly: false });
    expect(result).toEqual([products[1]]);
  });

  it("filters to outliers only", () => {
    const result = filterProducts(products, { category: null, comparability: null, outliersOnly: true });
    expect(result).toEqual([products[1]]);
  });

  it("combines filters", () => {
    const result = filterProducts(products, { category: "Hot", comparability: null, outliersOnly: true });
    expect(result).toEqual([products[1]]);
  });
});

describe("sortProducts", () => {
  it("sorts by price_index ascending, nulls last regardless of direction", () => {
    const products = [
      product("Hot", "A", { price_index: 120 }),
      product("Hot", "B", { price_index: null }),
      product("Hot", "C", { price_index: 80 }),
    ];
    expect(sortProducts(products, "price_index", "asc").map((p) => p.product)).toEqual(["C", "A", "B"]);
    expect(sortProducts(products, "price_index", "desc").map((p) => p.product)).toEqual(["A", "C", "B"]);
  });

  it("sorts by product name alphabetically", () => {
    const products = [product("Hot", "Zebra"), product("Hot", "Apple")];
    expect(sortProducts(products, "product", "asc").map((p) => p.product)).toEqual(["Apple", "Zebra"]);
  });

  it("sorts by tier in Value < Core < Premium order, not alphabetically, nulls last", () => {
    const products = [
      product("Hot", "A", { tier: "Premium" }),
      product("Hot", "B", { tier: "Value" }),
      product("Hot", "C", { tier: null }),
      product("Hot", "D", { tier: "Core" }),
    ];
    expect(sortProducts(products, "tier", "asc").map((p) => p.product)).toEqual(["B", "D", "A", "C"]);
    expect(sortProducts(products, "tier", "desc").map((p) => p.product)).toEqual(["A", "D", "B", "C"]);
  });
});

describe("uniqueCategories", () => {
  it("returns sorted unique category names", () => {
    const products = [product("Zebra", "A"), product("Alpha", "B"), product("Zebra", "C")];
    expect(uniqueCategories(products)).toEqual(["Alpha", "Zebra"]);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 45 }, (_, i) => i);

  it("returns the requested page of items", () => {
    const page = paginate(items, 2, 20);
    expect(page.items).toEqual(items.slice(20, 40));
    expect(page.currentPage).toBe(2);
    expect(page.totalPages).toBe(3);
    expect(page.totalItems).toBe(45);
  });

  it("clamps to the last page when requested page exceeds total pages", () => {
    const page = paginate(items, 99, 20);
    expect(page.currentPage).toBe(3);
    expect(page.items).toEqual(items.slice(40, 45));
  });

  it("clamps to page 1 when requested page is below 1", () => {
    const page = paginate(items, 0, 20);
    expect(page.currentPage).toBe(1);
  });

  it("always returns at least 1 total page, even for an empty list", () => {
    const page = paginate([], 1, 20);
    expect(page.totalPages).toBe(1);
    expect(page.items).toEqual([]);
  });
});
