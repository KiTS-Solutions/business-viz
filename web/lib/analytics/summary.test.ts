import { describe, it, expect } from "vitest";
import { computeSummaryKpis } from "./summary";
import type { PricingReport } from "../data/types";

function buildReport(): PricingReport {
  return {
    meta: {
      client: "Stories",
      report_date: "2026-03-01",
      currency: "LBP",
      fx_usd_rate: 89600,
      fx_rate_date: "2026-07-20",
      fx_source: "test",
      own_brand: "Stories",
      competitors: ["Espresso Lab"],
    },
    products: [{}, {}, {}] as PricingReport["products"],
    categories: [
      { category: "Hot", product_count: 2, countable_product_count: 2, avg_price_index: 120 },
      { category: "Cold", product_count: 1, countable_product_count: 1, avg_price_index: 80 },
    ],
  };
}

describe("computeSummaryKpis", () => {
  it("computes overall average index and above/below counts", () => {
    const kpis = computeSummaryKpis(buildReport());
    expect(kpis.overallAvgIndex).toBe(100);
    expect(kpis.categoriesAboveMarket).toBe(1);
    expect(kpis.categoriesBelowMarket).toBe(1);
  });

  it("computes coverage percentage from countable products vs total products", () => {
    const kpis = computeSummaryKpis(buildReport());
    expect(kpis.coveragePct).toBe(100);
  });

  it("ranks top over- and under-indexed categories", () => {
    const kpis = computeSummaryKpis(buildReport());
    expect(kpis.topOverIndexed[0].category).toBe("Hot");
    expect(kpis.topUnderIndexed[0].category).toBe("Cold");
  });
});
