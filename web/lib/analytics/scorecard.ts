import type { PricingReport } from "../data/types";

export interface ReportScorecard {
  reportLabel: string;
  itemCount: number;
  avgGapLbp: number | null;
  overpricedCount: number;
  underpricedCount: number;
}

export function computeReportScorecard(report: PricingReport, reportLabel: string): ReportScorecard {
  const withGap = report.products.filter(
    (p): p is typeof p & { own_price_lbp: number; competitor_avg_lbp: number } =>
      p.own_price_lbp !== null && p.competitor_avg_lbp !== null && p.comparability !== "low"
  );

  const itemCount = withGap.length;
  const avgGapLbp = itemCount
    ? Math.round(withGap.reduce((sum, p) => sum + (p.own_price_lbp - p.competitor_avg_lbp), 0) / itemCount)
    : null;

  return {
    reportLabel,
    itemCount,
    avgGapLbp,
    overpricedCount: report.products.filter((p) => p.is_outlier && p.outlier_direction === "overpriced").length,
    underpricedCount: report.products.filter((p) => p.is_outlier && p.outlier_direction === "underpriced").length,
  };
}

export function buildHeadline(scorecards: ReportScorecard[]): string {
  const above = scorecards.filter((s) => s.avgGapLbp !== null && s.avgGapLbp > 0).map((s) => s.reportLabel);
  const below = scorecards.filter((s) => s.avgGapLbp !== null && s.avgGapLbp < 0).map((s) => s.reportLabel);

  if (above.length && below.length) {
    return `Priced above market in ${above.join(", ")}; below market in ${below.join(", ")}.`;
  }
  if (above.length) {
    return `Priced above market in ${above.join(", ")}.`;
  }
  if (below.length) {
    return `Priced below market in ${below.join(", ")}.`;
  }
  return "Pricing sits at par with market across all benchmarked categories.";
}
