import type { CategoryRollup } from "../data/types";

export interface CategoryPositioningRow {
  category: string;
  avgIndex: number;
  deviation: number;
  direction: "above" | "below" | "at-par";
}

export function prepareCategoryPositioning(categories: CategoryRollup[]): CategoryPositioningRow[] {
  return categories
    .filter((c): c is CategoryRollup & { avg_price_index: number } => c.avg_price_index !== null)
    .map((c) => {
      const deviation = Math.round((c.avg_price_index - 100) * 10) / 10;
      const direction: CategoryPositioningRow["direction"] =
        deviation > 0.5 ? "above" : deviation < -0.5 ? "below" : "at-par";
      return { category: c.category, avgIndex: c.avg_price_index, deviation, direction };
    })
    .sort((a, b) => b.deviation - a.deviation);
}
