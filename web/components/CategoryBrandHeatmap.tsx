import type { HeatmapCell, HeatmapRow } from "@/lib/analytics/heatmap";
import { heatmapBin } from "@/lib/analytics/heatmap";

const BIN_STYLES: Record<string, { bg: string; text: string }> = {
  "strong-below": { bg: "#6d28d9", text: "#ffffff" },
  below: { bg: "#ddd6fe", text: "#3b1f7a" },
  "at-par": { bg: "#f1f5f9", text: "#1f4d3d" },
  above: { bg: "#fecaca", text: "#7a1717" },
  "strong-above": { bg: "#b91c1c", text: "#ffffff" },
  "no-data": { bg: "#ffffff", text: "#94a3b8" },
};

const NO_PEER_STYLE = { bg: "#eef2f4", text: "#52707c" };

function cellTitle(cell: HeatmapCell, category: string): string {
  if (cell.status === "priced") return `${cell.brand} — ${category}: index ${cell.indexValue}`;
  if (cell.status === "no-peer") {
    return `${cell.brand} — ${category}: priced (~${Math.round((cell.avgPriceLbp ?? 0) / 1000)}k LBP avg) but no competitor sells in this category, so no index can be computed`;
  }
  return `${cell.brand} — ${category}: no priced item in this category`;
}

function cellContent(cell: HeatmapCell): string {
  if (cell.status === "priced" && cell.indexValue !== null) return String(Math.round(cell.indexValue));
  if (cell.status === "no-peer" && cell.avgPriceLbp !== null) return `${Math.round(cell.avgPriceLbp / 1000)}k`;
  return "—";
}

export function CategoryBrandHeatmap({ rows, brands, ownBrand }: { rows: HeatmapRow[]; brands: string[]; ownBrand: string }) {
  return (
    <div aria-label="Category by Brand Price Heatmap" data-testid="category-brand-heatmap">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-ocean-muted">
        <LegendCell style={BIN_STYLES["strong-below"]} label="15%+ below peers" />
        <LegendCell style={BIN_STYLES["below"]} label="5–15% below" />
        <LegendCell style={BIN_STYLES["at-par"]} label="within 5% (at par)" />
        <LegendCell style={BIN_STYLES["above"]} label="5–15% above" />
        <LegendCell style={BIN_STYLES["strong-above"]} label="15%+ above peers" />
        <LegendCell style={NO_PEER_STYLE} label="priced, but no competitor here to compare to" />
        <LegendCell style={BIN_STYLES["no-data"]} label="not sold in this category" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white p-1 text-left font-normal text-ocean-muted">Category</th>
              {brands.map((b) => (
                <th
                  key={b}
                  className={`p-1 text-center font-normal ${b === ownBrand ? "font-semibold text-ocean" : "text-ocean-muted"}`}
                >
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <th scope="row" className="sticky left-0 bg-white p-1 text-left font-normal text-ocean-muted">
                  {row.category}
                </th>
                {row.cells.map((cell) => {
                  const style = cell.status === "priced" ? BIN_STYLES[heatmapBin(cell.indexValue)] : cell.status === "no-peer" ? NO_PEER_STYLE : BIN_STYLES["no-data"];
                  return (
                    <td
                      key={cell.brand}
                      title={cellTitle(cell, row.category)}
                      className={`p-1.5 text-center tabular-nums ${cell.brand === ownBrand ? "ring-2 ring-ocean/40" : ""}`}
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {cellContent(cell)}
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

function LegendCell({ style, label }: { style: { bg: string; text: string }; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-sm border border-ocean/10" style={{ backgroundColor: style.bg }} />
      {label}
    </span>
  );
}
