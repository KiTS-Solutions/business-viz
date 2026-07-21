import { loadReport } from "@/lib/data/loadReport";
import { computeSummaryKpis } from "@/lib/analytics/summary";
import { prepareCategoryPositioning } from "@/lib/analytics/categoryPositioning";
import { groupOutlierFindings } from "@/lib/analytics/findings";
import { buildCategoryPriceMap } from "@/lib/analytics/positioningMap";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { CategoryPositioning } from "@/components/CategoryPositioning";
import { CategoryPriceMap } from "@/components/CategoryPriceMap";
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
  const priceMapRows = buildCategoryPriceMap(report.products);

  return (
    <PresenterModeProvider>
      <ContextBar meta={report.meta} coveragePct={kpis.coveragePct} />
      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <header className="flex items-center justify-between border-b border-ocean/10 pb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ruya-logo.jpg" alt="Ru'ya 360" className="h-10 w-auto" />
          <div className="text-right">
            <h1 className="font-display text-2xl text-ocean">Stories Pricing Benchmark</h1>
            <p className="text-xs text-ocean/60">Prepared for Stories by Ru&apos;ya 360</p>
          </div>
        </header>

        <div className="flex justify-end">
          <PresenterModeToggle />
        </div>

        <ExecutiveSummary kpis={kpis} />

        <section>
          <h2 className="mb-3 font-display text-lg text-ocean">Category Positioning</h2>
          <p className="mb-4 text-sm text-ocean/60">
            Stories&apos; average price index vs. the competitive market, by category. Positive
            = above market, negative = below market.
          </p>
          <CategoryPositioning rows={positioningRows} />
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg text-ocean">Price Positioning Map</h2>
          <p className="mb-4 text-sm text-ocean/60">
            Every brand&apos;s average price per category — Stories highlighted in Ocean. Use
            the filter to drill into a single category.
          </p>
          <CategoryPriceMap rows={priceMapRows} fxRate={report.meta.fx_usd_rate} ownBrand={report.meta.own_brand} />
        </section>

        <FindingsRecommendations findings={findings} fxRate={report.meta.fx_usd_rate} />

        <section>
          <h2 className="mb-3 font-display text-lg text-ocean">Full Data Explorer</h2>
          <DataExplorer products={report.products} fxRate={report.meta.fx_usd_rate} />
        </section>

        <footer className="border-t border-ocean/10 pt-6 text-xs text-ocean/50">
          <p>Confidential — prepared for Stories by Ru&apos;ya 360. Not for external distribution.</p>
          <p>Report period: {report.meta.report_date} · Generated from {report.meta.generated_from ?? "source data"}.</p>
        </footer>
      </main>
    </PresenterModeProvider>
  );
}
