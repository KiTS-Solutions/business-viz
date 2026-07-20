import { loadReport } from "@/lib/data/loadReport";
import { computeSummaryKpis } from "@/lib/analytics/summary";
import { prepareCategoryPositioning } from "@/lib/analytics/categoryPositioning";
import { groupOutlierFindings } from "@/lib/analytics/findings";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { CategoryPositioning } from "@/components/CategoryPositioning";
import { FindingsRecommendations } from "@/components/FindingsRecommendations";
import { PresenterModeToggle } from "@/components/PresenterModeToggle";
import { DataExplorer } from "@/components/DataExplorer";
import { ContextBar } from "@/components/ContextBar";
import { PresenterModeProvider } from "@/lib/presenter/PresenterModeContext";

export default function Home() {
  const report = loadReport("stories-pricing-2026-03");
  const kpis = computeSummaryKpis(report);
  const positioningRows = prepareCategoryPositioning(report.categories);
  const findings = groupOutlierFindings(report.products);

  return (
    <PresenterModeProvider>
      <ContextBar meta={report.meta} coveragePct={kpis.coveragePct} />
      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <header className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-ocean">Stories Pricing Benchmark</h1>
          <PresenterModeToggle />
        </header>
        <ExecutiveSummary kpis={kpis} />
        <CategoryPositioning rows={positioningRows} />
        <FindingsRecommendations findings={findings} fxRate={report.meta.fx_usd_rate} />
        <DataExplorer products={report.products} fxRate={report.meta.fx_usd_rate} />
      </main>
    </PresenterModeProvider>
  );
}
