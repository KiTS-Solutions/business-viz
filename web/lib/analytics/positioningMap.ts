import type { ProductAnalytics } from "../data/types";

export interface BrandPricePoint {
  brand: string;
  avgPriceLbp: number;
  productCount: number;
}

export interface CategoryPriceMapRow {
  category: string;
  brands: BrandPricePoint[];
}

/**
 * Aggregates every product's per-brand prices into one average price point
 * per (category, brand) — the input to the Price Positioning Map. Uses
 * ProductAnalytics.prices_lbp directly (already has every brand that priced
 * that product), so no pipeline changes are needed.
 */
export function buildCategoryPriceMap(products: ProductAnalytics[]): CategoryPriceMapRow[] {
  const byCategory = new Map<string, Map<string, { sum: number; count: number }>>();

  for (const product of products) {
    let brandTotals = byCategory.get(product.category);
    if (!brandTotals) {
      brandTotals = new Map();
      byCategory.set(product.category, brandTotals);
    }
    for (const [brand, price] of Object.entries(product.prices_lbp)) {
      const totals = brandTotals.get(brand) ?? { sum: 0, count: 0 };
      totals.sum += price;
      totals.count += 1;
      brandTotals.set(brand, totals);
    }
  }

  return Array.from(byCategory.entries())
    .map(([category, brandTotals]) => ({
      category,
      brands: Array.from(brandTotals.entries()).map(([brand, { sum, count }]) => ({
        brand,
        avgPriceLbp: Math.round(sum / count),
        productCount: count,
      })),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

/** Filters the full category price map down to one category, for drill-down. */
export function filterCategoryPriceMap(
  rows: CategoryPriceMapRow[],
  category: string | null
): CategoryPriceMapRow[] {
  if (!category) return rows;
  return rows.filter((r) => r.category === category);
}
