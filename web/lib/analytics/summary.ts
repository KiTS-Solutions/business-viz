import type { CategoryRollup, PricingReport } from "../data/types";

export interface SummaryKpis {
  overallAvgIndex: number | null;
  categoriesAboveMarket: number;
  categoriesBelowMarket: number;
  coveragePct: number;
  topOverIndexed: CategoryRollup[];
  topUnderIndexed: CategoryRollup[];
}

export function computeSummaryKpis(report: PricingReport): SummaryKpis {
  const withIndex = report.categories.filter(
    (c): c is CategoryRollup & { avg_price_index: number } => c.avg_price_index !== null
  );

  const overallAvgIndex = withIndex.length
    ? Math.round((withIndex.reduce((sum, c) => sum + c.avg_price_index, 0) / withIndex.length) * 10) / 10
    : null;

  const categoriesAboveMarket = withIndex.filter((c) => c.avg_price_index > 100).length;
  const categoriesBelowMarket = withIndex.filter((c) => c.avg_price_index < 100).length;

  const totalCountable = report.categories.reduce((sum, c) => sum + c.countable_product_count, 0);
  const coveragePct = report.products.length
    ? Math.round((totalCountable / report.products.length) * 1000) / 10
    : 0;

  const sortedDescending = [...withIndex].sort((a, b) => b.avg_price_index - a.avg_price_index);
  const sortedAscending = [...withIndex].sort((a, b) => a.avg_price_index - b.avg_price_index);

  return {
    overallAvgIndex,
    categoriesAboveMarket,
    categoriesBelowMarket,
    coveragePct,
    topOverIndexed: sortedDescending.slice(0, 3),
    topUnderIndexed: sortedAscending.slice(0, 3),
  };
}
