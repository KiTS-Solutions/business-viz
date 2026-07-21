import type { ReportMeta } from "@/lib/data/types";

export function ContextBar({ meta, coveragePct }: { meta: ReportMeta; coveragePct: number }) {
  return (
    <div className="bg-ocean px-6 py-3 text-white/80">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs leading-relaxed">
          Prepared for <strong className="text-white">{meta.client}</strong> — {meta.report_date} · Currency:{" "}
          {meta.currency}, USD shown as equivalent · FX: {meta.fx_usd_rate.toLocaleString("en-US")} LBP/USD as of{" "}
          {meta.fx_rate_date} (source: {meta.fx_source})
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/60">
          Coverage note: {coveragePct}% of line items have enough competitor pricing (2+ competitors) for a reliable
          market comparison; lower-comparability items are shown in the Data Explorer but excluded from category
          averages.
        </p>
      </div>
    </div>
  );
}
