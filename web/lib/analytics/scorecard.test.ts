import { describe, it, expect } from "vitest";
import { computeReportScorecard, buildHeadline } from "./scorecard";
import type { PricingReport, ProductAnalytics } from "../data/types";

function product(overrides: Partial<ProductAnalytics>): ProductAnalytics {
  return {
    category: "Test",
    product: "Item",
    prices_lbp: {},
    own_price_lbp: null,
    competitor_avg_lbp: null,
    price_index: null,
    comparability: "high",
    tier: null,
    is_outlier: false,
    outlier_direction: null,
    ...overrides,
  };
}

function report(products: ProductAnalytics[]): PricingReport {
  return {
    meta: {
      client: "Stories",
      report_date: "2026-07-22",
      currency: "LBP",
      fx_usd_rate: 89600,
      fx_rate_date: "2026-07-20",
      fx_source: "test",
      own_brand: "Stories",
      competitors: ["Espresso Lab"],
    },
    products,
    categories: [],
    data_quality_warnings: [],
  };
}

describe("computeReportScorecard", () => {
  it("averages the signed LBP gap across comparable, priced items only", () => {
    const r = report([
      product({ own_price_lbp: 500000, competitor_avg_lbp: 400000, comparability: "high" }),
      product({ own_price_lbp: 300000, competitor_avg_lbp: 400000, comparability: "medium" }),
      product({ own_price_lbp: 900000, competitor_avg_lbp: 100000, comparability: "low" }),
      product({ own_price_lbp: null, competitor_avg_lbp: 400000 }),
    ]);

    const scorecard = computeReportScorecard(r, "Main Menu");

    expect(scorecard.reportLabel).toBe("Main Menu");
    expect(scorecard.itemCount).toBe(2);
    expect(scorecard.avgGapLbp).toBe(0);
  });

  it("counts outliers independently of the comparability filter used for the gap average", () => {
    const r = report([
      product({ own_price_lbp: 500000, competitor_avg_lbp: 400000, is_outlier: true, outlier_direction: "overpriced" }),
      product({ own_price_lbp: 300000, competitor_avg_lbp: 400000, is_outlier: true, outlier_direction: "underpriced" }),
      product({ own_price_lbp: 400000, competitor_avg_lbp: 400000, is_outlier: false }),
    ]);

    const scorecard = computeReportScorecard(r, "Main Menu");

    expect(scorecard.overpricedCount).toBe(1);
    expect(scorecard.underpricedCount).toBe(1);
  });

  it("returns a null gap when no items qualify", () => {
    const r = report([product({ own_price_lbp: null, competitor_avg_lbp: null })]);
    const scorecard = computeReportScorecard(r, "Empty");
    expect(scorecard.itemCount).toBe(0);
    expect(scorecard.avgGapLbp).toBeNull();
  });
});

describe("buildHeadline", () => {
  it("names groups above and below market when both exist", () => {
    const headline = buildHeadline([
      { reportLabel: "Main Menu", itemCount: 10, avgGapLbp: 15000, overpricedCount: 2, underpricedCount: 0 },
      { reportLabel: "Frozen Yogurt Bar", itemCount: 5, avgGapLbp: -20000, overpricedCount: 0, underpricedCount: 3 },
    ]);
    expect(headline).toBe("Priced above market in Main Menu; below market in Frozen Yogurt Bar.");
  });

  it("names only the above-market groups when nothing is below", () => {
    const headline = buildHeadline([
      { reportLabel: "Main Menu", itemCount: 10, avgGapLbp: 15000, overpricedCount: 2, underpricedCount: 0 },
    ]);
    expect(headline).toBe("Priced above market in Main Menu.");
  });

  it("falls back to an at-par message when nothing has a nonzero gap", () => {
    const headline = buildHeadline([
      { reportLabel: "Main Menu", itemCount: 10, avgGapLbp: 0, overpricedCount: 0, underpricedCount: 0 },
    ]);
    expect(headline).toBe("Pricing sits at par with market across all benchmarked categories.");
  });
});
