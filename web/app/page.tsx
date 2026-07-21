import { loadReport } from "@/lib/data/loadReport";
import { withBasePath } from "@/lib/basePath";
import { formatReportPeriod } from "@/lib/format/date";
import { cleanDisplayFileName } from "@/lib/format/filename";
import { computeSummaryKpis } from "@/lib/analytics/summary";
import { prepareCategoryPositioning } from "@/lib/analytics/categoryPositioning";
import { groupOutlierFindings } from "@/lib/analytics/findings";
import { buildCategoryPriceMap } from "@/lib/analytics/positioningMap";
import { buildCategoryBrandHeatmap } from "@/lib/analytics/heatmap";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { CategoryPositioning } from "@/components/CategoryPositioning";
import { CategoryPriceMap } from "@/components/CategoryPriceMap";
import { CategoryBrandHeatmap } from "@/components/CategoryBrandHeatmap";
import { FindingsRecommendations } from "@/components/FindingsRecommendations";
import { PresenterModeToggle } from "@/components/PresenterModeToggle";
import { DataExplorer } from "@/components/DataExplorer";
import { ContextBar } from "@/components/ContextBar";
import { Methodology } from "@/components/Methodology";
import { Section } from "@/components/Section";
import { PresenterModeProvider } from "@/lib/presenter/PresenterModeContext";

export default function Home() {
  const report = loadReport("stories-pricing-2026-03");
  const kpis = computeSummaryKpis(report);
  const positioningRows = prepareCategoryPositioning(report.categories);
  const findings = groupOutlierFindings(report.products);
  const priceMapRows = buildCategoryPriceMap(report.products, report.meta.own_brand);
  const allBrands = [report.meta.own_brand, ...report.meta.competitors];
  const heatmapRows = buildCategoryBrandHeatmap(priceMapRows, allBrands);

  return (
    <PresenterModeProvider>
      {/* Cover */}
      <div className="border-b border-ocean/10 bg-white px-6 pb-10 pt-8">
        <div className="mx-auto flex max-w-6xl items-start justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBasePath("/ruya-logo.jpg")} alt="Ru'ya 360" className="h-9 w-auto" />
          <PresenterModeToggle />
        </div>
        <div className="mx-auto mt-10 max-w-6xl">
          <p className="text-xs uppercase tracking-widest text-ocean-muted">Pricing Strategy Advisory</p>
          <h1 className="mt-2 font-display text-4xl text-ocean sm:text-5xl">Stories Pricing Benchmark</h1>
          <p className="mt-3 max-w-2xl text-sm text-ocean-muted">
            A full-menu competitive price positioning analysis for {report.meta.client}, benchmarked against{" "}
            {report.meta.competitors.length} market competitors.
          </p>
        </div>
      </div>

      <ContextBar meta={report.meta} />

      <main className="mx-auto max-w-6xl px-6">
        <Section title="Executive Summary" first>
          <ExecutiveSummary kpis={kpis} />
        </Section>

        <Section title="Methodology & Data Sources">
          <Methodology meta={report.meta} warnings={report.data_quality_warnings} />
        </Section>

        <Section title="Competitive Landscape at a Glance">
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            Every category against every brand in one grid — each cell is that brand&apos;s average price
            relative to the other brands priced in that category (100 = at par with peers). Red = priced above
            peers, violet = priced below. A blank cell means that brand doesn&apos;t sell in that category at
            all; a light gray cell with a price on it means the item is priced but no competitor sells there to
            benchmark against — see the full legend below the grid. {report.meta.client}&apos;s column is
            outlined.
          </p>
          <CategoryBrandHeatmap rows={heatmapRows} brands={allBrands} ownBrand={report.meta.own_brand} />
        </Section>

        <Section title="Category Positioning">
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            A closer, {report.meta.client}-focused view: how far {report.meta.client} sits above or below the
            competitor-only average in each category. This is the same relationship as the heatmap above, isolated
            to {report.meta.client} and shown as a deviation from market rather than an index.
          </p>
          <CategoryPositioning rows={positioningRows} />
        </Section>

        <Section title="Price Positioning Map">
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            Every brand&apos;s average price per category. {report.meta.client} is shown in Ocean with a bold
            outline; each competitor has its own color (see legend). The shaded band marks the competitor price
            range — where {report.meta.client}&apos;s dot falls inside, at the edge, or outside that band is the
            read. Filter to a single category for a closer look.
          </p>
          <CategoryPriceMap rows={priceMapRows} fxRate={report.meta.fx_usd_rate} ownBrand={report.meta.own_brand} />
        </Section>

        <FindingsRecommendations findings={findings} fxRate={report.meta.fx_usd_rate} />

        <Section title="Full Data Explorer" last>
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            Every priced line item, with search, filters, and sortable columns. Click a row to see every brand&apos;s
            price for that item side by side — not just {report.meta.client}&apos;s.
          </p>
          <DataExplorer products={report.products} fxRate={report.meta.fx_usd_rate} ownBrand={report.meta.own_brand} />
        </Section>
      </main>

      <footer className="mt-4 border-t border-ocean/10 bg-ocean/5 px-6 py-6 text-xs text-ocean-muted">
        <div className="mx-auto max-w-6xl">
          <p>Confidential — prepared for {report.meta.client} by Ru&apos;ya 360. Not for external distribution.</p>
          <p className="mt-1">
            Report period: {formatReportPeriod(report.meta.report_date)} · Source:{" "}
            {report.meta.generated_from ? cleanDisplayFileName(report.meta.generated_from) : "internal pricing data"}.
          </p>
        </div>
      </footer>
    </PresenterModeProvider>
  );
}
