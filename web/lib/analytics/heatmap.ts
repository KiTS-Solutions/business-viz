import type { CategoryPriceMapRow } from "./positioningMap";

export type CellStatus = "priced" | "not-priced" | "no-peer";

export interface HeatmapCell {
  brand: string;
  indexValue: number | null; // this brand's avg price ÷ every OTHER priced brand's avg price in this category × 100
  avgPriceLbp: number | null;
  productCount: number;
  /**
   * "priced" = has both a price and a peer average to index against.
   * "not-priced" = this brand has no priced item in this category at all —
   *   genuine data sparsity in the source spreadsheet.
   * "no-peer" = this brand DOES have a price here, but no other brand is
   *   priced in this category, so no index can be computed. Distinct from
   *   "not-priced" because there IS a real number (avgPriceLbp) to show —
   *   an earlier version collapsed both into one blank dash, which made
   *   priced categories (including some of the client's largest, e.g.
   *   Frozen Yogurt) look like they had no data at all.
   */
  status: CellStatus;
}

export interface HeatmapRow {
  category: string;
  cells: HeatmapCell[];
}

/**
 * Extends the report's own Price Index methodology (own price ÷ peer average
 * × 100) symmetrically to every brand, not just the client — so the same
 * "index relative to peers" concept that already defines Price Index in the
 * pipeline can be shown for the whole competitive set in one grid.
 */
export function buildCategoryBrandHeatmap(priceMapRows: CategoryPriceMapRow[], brands: string[]): HeatmapRow[] {
  return priceMapRows.map((row) => {
    const byBrand = new Map(row.brands.map((b) => [b.brand, b]));
    const cells: HeatmapCell[] = brands.map((brand) => {
      const own = byBrand.get(brand);
      const peers = row.brands.filter((b) => b.brand !== brand);

      if (!own) {
        return { brand, indexValue: null, avgPriceLbp: null, productCount: 0, status: "not-priced" };
      }
      if (peers.length === 0) {
        return {
          brand,
          indexValue: null,
          avgPriceLbp: own.avgPriceLbp,
          productCount: own.productCount,
          status: "no-peer",
        };
      }

      const peerAvg = peers.reduce((sum, p) => sum + p.avgPriceLbp, 0) / peers.length;
      return {
        brand,
        indexValue: Math.round((own.avgPriceLbp / peerAvg) * 100 * 10) / 10,
        avgPriceLbp: own.avgPriceLbp,
        productCount: own.productCount,
        status: "priced",
      };
    });
    return { category: row.category, cells };
  });
}

export type HeatmapBin = "strong-below" | "below" | "at-par" | "above" | "strong-above" | "no-data";

export function heatmapBin(indexValue: number | null): HeatmapBin {
  if (indexValue === null) return "no-data";
  const deviation = indexValue - 100;
  if (deviation <= -15) return "strong-below";
  if (deviation < -5) return "below";
  if (deviation < 5) return "at-par";
  if (deviation < 15) return "above";
  return "strong-above";
}
