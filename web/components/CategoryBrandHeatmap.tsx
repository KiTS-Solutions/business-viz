import type { HeatmapRow } from "@/lib/analytics/heatmap";
import { heatmapBin } from "@/lib/analytics/heatmap";

const BIN_STYLES: Record<string, { bg: string; text: string }> = {
  "strong-below": { bg: "#6d28d9", text: "#ffffff" },
  below: { bg: "#ddd6fe", text: "#3b1f7a" },
  "at-par": { bg: "#f1f5f9", text: "#2f5b6b" },
  above: { bg: "#fecaca", text: "#7a1717" },
  "strong-above": { bg: "#b91c1c", text: "#ffffff" },
  "no-data": { bg: "#ffffff", text: "#94a3b8" },
};

export function CategoryBrandHeatmap({ rows, brands, ownBrand }: { rows: HeatmapRow[]; brands: string[]; ownBrand: string }) {
  return (
    <div aria-label="Category by Brand Price Heatmap" data-testid="category-brand-heatmap">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-ocean/70">
        <LegendCell bin="strong-below" label="15%+ below peers" />
        <LegendCell bin="below" label="5–15% below" />
        <LegendCell bin="at-par" label="within 5% (at par)" />
        <LegendCell bin="above" label="5–15% above" />
        <LegendCell bin="strong-above" label="15%+ above peers" />
        <LegendCell bin="no-data" label="no data" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white p-1 text-left font-normal text-ocean/50">Category</th>
              {brands.map((b) => (
                <th
                  key={b}
                  className={`p-1 text-center font-normal ${b === ownBrand ? "font-semibold text-ocean" : "text-ocean/50"}`}
                >
                  {b === ownBrand ? `${b} (client)` : b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <th scope="row" className="sticky left-0 bg-white p-1 text-left font-normal text-ocean/70">
                  {row.category}
                </th>
                {row.cells.map((cell) => {
                  const bin = heatmapBin(cell.indexValue);
                  const style = BIN_STYLES[bin];
                  return (
                    <td
                      key={cell.brand}
                      title={`${cell.brand} — ${row.category}: ${cell.indexValue !== null ? `index ${cell.indexValue}` : "no price data"}`}
                      className={`p-1.5 text-center tabular-nums ${cell.brand === ownBrand ? "ring-2 ring-ocean/40" : ""}`}
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {cell.indexValue !== null ? Math.round(cell.indexValue) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LegendCell({ bin, label }: { bin: string; label: string }) {
  const style = BIN_STYLES[bin];
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: style.bg }} />
      {label}
    </span>
  );
}
