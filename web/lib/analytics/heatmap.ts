import type { CategoryPriceMapRow } from "./positioningMap";

export interface HeatmapCell {
  brand: string;
  indexValue: number | null; // this brand's avg price ÷ every OTHER priced brand's avg price in this category × 100
  avgPriceLbp: number | null;
  productCount: number;
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
      if (!own || peers.length === 0) {
        return { brand, indexValue: null, avgPriceLbp: own?.avgPriceLbp ?? null, productCount: own?.productCount ?? 0 };
      }
      const peerAvg = peers.reduce((sum, p) => sum + p.avgPriceLbp, 0) / peers.length;
      return {
        brand,
        indexValue: Math.round((own.avgPriceLbp / peerAvg) * 100 * 10) / 10,
        avgPriceLbp: own.avgPriceLbp,
        productCount: own.productCount,
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
