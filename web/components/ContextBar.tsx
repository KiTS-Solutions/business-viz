import type { ReportMeta } from "@/lib/data/types";
import { formatReportPeriod, formatFullDate } from "@/lib/format/date";

export function ContextBar({ meta }: { meta: ReportMeta }) {
  return (
    <div className="bg-ocean px-6 py-3 text-white/80">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs leading-relaxed">
          Prepared for <strong className="text-white">{meta.client}</strong> — {formatReportPeriod(meta.report_date)} ·
          Currency: {meta.currency}, USD shown as equivalent · FX: {meta.fx_usd_rate.toLocaleString("en-US")} LBP/USD as
          of {formatFullDate(meta.fx_rate_date)} (source: {meta.fx_source})
        </p>
      </div>
    </div>
  );
}
