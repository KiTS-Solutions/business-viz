import type { SummaryKpis } from "@/lib/analytics/summary";

export function ExecutiveSummary({ kpis }: { kpis: SummaryKpis }) {
  return (
    <section aria-label="Executive Summary" className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <KpiTile
        label="Overall Price Index"
        value={kpis.overallAvgIndex !== null ? `${kpis.overallAvgIndex}` : "—"}
      />
      <KpiTile label="Categories Above Market" value={String(kpis.categoriesAboveMarket)} />
      <KpiTile label="Categories Below Market" value={String(kpis.categoriesBelowMarket)} />
      <KpiTile label="Data Coverage" value={`${kpis.coveragePct}%`} />
    </section>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t-2 border-ocean/15 pt-3">
      <p className="text-sm text-ocean/60">{label}</p>
      <p className="font-display text-4xl text-ocean">{value}</p>
    </div>
  );
}
