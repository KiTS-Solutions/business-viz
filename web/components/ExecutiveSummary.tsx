import type { SummaryKpis } from "@/lib/analytics/summary";

export function ExecutiveSummary({ kpis }: { kpis: SummaryKpis }) {
  const topOver = kpis.topOverIndexed[0];
  const topUnder = kpis.topUnderIndexed[0];

  return (
    <section aria-label="Executive Summary" className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-3">
      <KpiTile
        label="Overall Price Index"
        value={kpis.overallAvgIndex !== null ? `${kpis.overallAvgIndex}` : "—"}
        sublabel="unweighted avg. across categories; 100 = at par"
      />
      <KpiTile label="Items Benchmarked" value={String(kpis.itemsBenchmarked)} sublabel="menu items priced by Stories" />
      <KpiTile
        label="Repricing Candidates"
        value={String(kpis.repricingCandidates)}
        sublabel="priced 15%+ above market"
      />
      <KpiTile
        label="Trade-Up Opportunities"
        value={String(kpis.tradeUpOpportunities)}
        sublabel="priced 15%+ below market"
      />
      <KpiTile
        label="Most Above Market"
        value={topOver ? `${topOver.avg_price_index}` : "—"}
        sublabel={topOver ? topOver.category : "no category data"}
      />
      <KpiTile
        label="Most Below Market"
        value={topUnder ? `${topUnder.avg_price_index}` : "—"}
        sublabel={topUnder ? topUnder.category : "no category data"}
      />
    </section>
  );
}

function KpiTile({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="border-t-2 border-ocean/15 pt-3">
      <p className="text-sm text-ocean-muted">{label}</p>
      <p className="font-display text-4xl text-ocean">{value}</p>
      <p className="mt-0.5 text-xs text-ocean-muted">{sublabel}</p>
    </div>
  );
}
