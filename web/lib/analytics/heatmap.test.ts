import { describe, it, expect } from "vitest";
import { buildCategoryBrandHeatmap, heatmapBin } from "./heatmap";
import type { CategoryPriceMapRow } from "./positioningMap";

describe("buildCategoryBrandHeatmap", () => {
  it("computes each brand's index relative to every OTHER brand's average", () => {
    const rows: CategoryPriceMapRow[] = [
      {
        category: "Hot",
        brands: [
          { brand: "Stories", avgPriceLbp: 300000, productCount: 2 },
          { brand: "Espresso Lab", avgPriceLbp: 400000, productCount: 1 },
          { brand: "Starbucks", avgPriceLbp: 400000, productCount: 1 },
        ],
        competitorMinLbp: 400000,
        competitorMaxLbp: 400000,
      },
    ];

    const heatmap = buildCategoryBrandHeatmap(rows, ["Stories", "Espresso Lab", "Starbucks"]);
    const hot = heatmap[0];

    // Stories: 300000 / avg(400000,400000)=400000 * 100 = 75
    const storiesCell = hot.cells.find((c) => c.brand === "Stories");
    expect(storiesCell?.indexValue).toBe(75);
    expect(storiesCell?.status).toBe("priced");
    // Espresso Lab: 400000 / avg(300000,400000)=350000 * 100 = 114.3
    expect(hot.cells.find((c) => c.brand === "Espresso Lab")?.indexValue).toBe(114.3);
  });

  it("marks a brand with no price data in that category as not-priced", () => {
    const rows: CategoryPriceMapRow[] = [
      {
        category: "Hot",
        brands: [{ brand: "Stories", avgPriceLbp: 300000, productCount: 1 }],
        competitorMinLbp: null,
        competitorMaxLbp: null,
      },
    ];

    const heatmap = buildCategoryBrandHeatmap(rows, ["Stories", "Espresso Lab"]);
    const cell = heatmap[0].cells.find((c) => c.brand === "Espresso Lab");
    expect(cell?.indexValue).toBeNull();
    expect(cell?.avgPriceLbp).toBeNull();
    expect(cell?.status).toBe("not-priced");
  });

  it("marks a brand that HAS a price but no peer to compare against as no-peer, not not-priced", () => {
    const rows: CategoryPriceMapRow[] = [
      {
        category: "Frozen Yogurt",
        brands: [{ brand: "Stories", avgPriceLbp: 250000, productCount: 42 }],
        competitorMinLbp: null,
        competitorMaxLbp: null,
      },
    ];

    const heatmap = buildCategoryBrandHeatmap(rows, ["Stories", "Espresso Lab"]);
    const storiesCell = heatmap[0].cells.find((c) => c.brand === "Stories");
    expect(storiesCell?.status).toBe("no-peer");
    expect(storiesCell?.indexValue).toBeNull();
    // The real price must still be surfaced — this is the case the review
    // flagged: a bare dash made the client's own priced category look empty.
    expect(storiesCell?.avgPriceLbp).toBe(250000);
  });
});

describe("heatmapBin", () => {
  it("bins null as no-data", () => {
    expect(heatmapBin(null)).toBe("no-data");
  });

  it("bins deviations into the five ranges", () => {
    expect(heatmapBin(80)).toBe("strong-below"); // -20
    expect(heatmapBin(92)).toBe("below"); // -8
    expect(heatmapBin(100)).toBe("at-par"); // 0
    expect(heatmapBin(108)).toBe("above"); // +8
    expect(heatmapBin(120)).toBe("strong-above"); // +20
  });

  it("treats the ±5 boundary as at-par, not the adjacent bin", () => {
    expect(heatmapBin(104.9)).toBe("at-par");
    expect(heatmapBin(95.1)).toBe("at-par");
  });
});
