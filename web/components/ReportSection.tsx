import type { PricingReport } from "@/lib/data/types";
import { prepareCategoryPositioning } from "@/lib/analytics/categoryPositioning";
import { groupOutlierFindings } from "@/lib/analytics/findings";
import { buildCategoryPriceMap } from "@/lib/analytics/positioningMap";
import { buildCategoryBrandHeatmap } from "@/lib/analytics/heatmap";
import { CategoryBrandHeatmap } from "@/components/CategoryBrandHeatmap";
import { CategoryPositioning } from "@/components/CategoryPositioning";
import { CategoryPriceMap } from "@/components/CategoryPriceMap";
import { FindingsRecommendations } from "@/components/FindingsRecommendations";
import { DataExplorer } from "@/components/DataExplorer";
import { Section } from "@/components/Section";
import { Explain } from "@/components/Explain";

export function ReportSection({ title, report }: { title: string; report: PricingReport }) {
  const positioningRows = prepareCategoryPositioning(report.categories);
  const findings = groupOutlierFindings(report.products);
  const priceMapRows = buildCategoryPriceMap(report.products, report.meta.own_brand);
  const allBrands = [report.meta.own_brand, ...report.meta.competitors];
  const heatmapRows = buildCategoryBrandHeatmap(priceMapRows, allBrands);

  return (
    <section aria-label={title} className="border-b border-ocean/10 pb-12 pt-12">
      <h2 className="mb-6 font-display text-2xl text-ocean">{title}</h2>

      <Section title="Competitive Landscape at a Glance" level={3}>
        <Explain>
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            Every category against every brand in one grid — each cell is that brand&apos;s average price
            relative to the other brands priced in that category (100 = at par with peers). Red = priced above
            peers, violet = priced below. A blank cell means that brand doesn&apos;t sell in that category at
            all; a light gray cell with a price on it means the item is priced but no competitor sells there to
            benchmark against — see the full legend below the grid. {report.meta.client}&apos;s column is
            outlined.
          </p>
        </Explain>
        <CategoryBrandHeatmap rows={heatmapRows} brands={allBrands} ownBrand={report.meta.own_brand} />
      </Section>

      <Section title="Category Positioning" level={3}>
        <Explain>
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            A closer, {report.meta.client}-focused view: how far {report.meta.client} sits above or below the
            competitor-only average in each category. This is the same relationship as the heatmap above, isolated
            to {report.meta.client} and shown as a deviation from market rather than an index.
          </p>
        </Explain>
        <CategoryPositioning rows={positioningRows} />
      </Section>

      <Section title="Price Positioning Map" level={3}>
        <Explain>
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            Every brand&apos;s average price per category. {report.meta.client} is shown in Ocean with a bold
            outline; each competitor has its own color (see legend). The shaded band marks the competitor price
            range — where {report.meta.client}&apos;s dot falls inside, at the edge, or outside that band is the
            read. Filter to a single category for a closer look.
          </p>
        </Explain>
        <CategoryPriceMap rows={priceMapRows} fxRate={report.meta.fx_usd_rate} ownBrand={report.meta.own_brand} />
      </Section>

      <FindingsRecommendations findings={findings} fxRate={report.meta.fx_usd_rate} />

      <Section title="Full Data Explorer" level={3} last>
        <Explain>
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            Every priced line item, with search, filters, and sortable columns. Click a row to see every brand&apos;s
            price for that item side by side — not just {report.meta.client}&apos;s.
          </p>
        </Explain>
        <DataExplorer products={report.products} fxRate={report.meta.fx_usd_rate} ownBrand={report.meta.own_brand} />
      </Section>
    </section>
  );
}
