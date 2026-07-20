import type { ReportMeta } from "@/lib/data/types";

export function ContextBar({ meta, coveragePct }: { meta: ReportMeta; coveragePct: number }) {
  return (
    <div className="border-b border-ocean/10 bg-ocean/5 px-6 py-3 text-xs text-ocean/70">
      <p>
        Prepared for <strong className="text-ocean">{meta.client}</strong> — {meta.report_date} · Currency:{" "}
        {meta.currency}, USD shown as equivalent · FX: {meta.fx_usd_rate.toLocaleString("en-US")} LBP/USD as of{" "}
        {meta.fx_rate_date} (source: {meta.fx_source})
      </p>
      <p className="mt-1">
        Coverage note: {coveragePct}% of line items have enough competitor pricing (2+ competitors) for a reliable
        market comparison; lower-comparability items are shown in the Data Explorer but excluded from category
        averages.
      </p>
    </div>
  );
}
