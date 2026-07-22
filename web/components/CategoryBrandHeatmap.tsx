"use client";

import type { HeatmapCell, HeatmapRow } from "@/lib/analytics/heatmap";
import { heatmapBin } from "@/lib/analytics/heatmap";
import { IndexDeviationBadge } from "@/components/IndexDeviationBadge";
import { useTheme } from "@/lib/theme/ThemeContext";

const BIN_STYLES: Record<string, { bg: string; text: string }> = {
  "strong-below": { bg: "#6d28d9", text: "#ffffff" },
  below: { bg: "#ddd6fe", text: "#3b1f7a" },
  "at-par": { bg: "#f1f5f9", text: "#1f4d3d" },
  above: { bg: "#fecaca", text: "#7a1717" },
  "strong-above": { bg: "#b91c1c", text: "#ffffff" },
  "no-data": { bg: "#ffffff", text: "#94a3b8" },
};

const NO_PEER_STYLE = { bg: "#eef2f4", text: "#52707c" };

// Dark-mode bins. strong-below/strong-above are already dark, saturated
// fills that read fine as self-contained colored badges regardless of page
// theme (same reasoning as --color-brand-surface), so those two are
// unchanged. The three near-white light-mode bins (below, at-par, above,
// no-data) would look like a bright cutout on a dark page, so those get
// dark-appropriate equivalents — each contrast-checked (text vs. its own
// bg): below 9.6:1, at-par 7.1:1, above 8.7:1, no-data 5.3:1.
const DARK_BIN_STYLES: Record<string, { bg: string; text: string }> = {
  "strong-below": { bg: "#6d28d9", text: "#ffffff" },
  below: { bg: "#2f2145", text: "#d8c9fa" },
  "at-par": { bg: "#1c2a23", text: "#9fb9ac" },
  above: { bg: "#3a1e1e", text: "#f3b4b4" },
  "strong-above": { bg: "#b91c1c", text: "#ffffff" },
  "no-data": { bg: "#0f1a16", text: "#7c9187" },
};

const DARK_NO_PEER_STYLE = { bg: "#23322b", text: "#9fb9ac" };

function cellTitle(cell: HeatmapCell, category: string): string {
  if (cell.status === "priced") return `${cell.brand} — ${category}: index ${cell.indexValue}`;
  if (cell.status === "no-peer") {
    return `${cell.brand} — ${category}: priced (~${Math.round((cell.avgPriceLbp ?? 0) / 1000)}k LBP avg) but not enough other brands price the same items here (need 2+ per item), so no reliable index can be computed`;
  }
  return `${cell.brand} — ${category}: no priced item in this category`;
}

function cellContent(cell: HeatmapCell) {
  if (cell.status === "priced" && cell.indexValue !== null) {
    return (
      <span className="flex flex-col items-center leading-tight">
        <span>{Math.round(cell.indexValue)}</span>
        <IndexDeviationBadge value={cell.indexValue} inheritColor />
      </span>
    );
  }
  if (cell.status === "no-peer" && cell.avgPriceLbp !== null) return `${Math.round(cell.avgPriceLbp / 1000)}k`;
  return "—";
}

export function CategoryBrandHeatmap({ rows, brands, ownBrand }: { rows: HeatmapRow[]; brands: string[]; ownBrand: string }) {
  const { theme } = useTheme();
  const binStyles = theme === "dark" ? DARK_BIN_STYLES : BIN_STYLES;
  const noPeerStyle = theme === "dark" ? DARK_NO_PEER_STYLE : NO_PEER_STYLE;

  return (
    <div aria-label="Category by Brand Price Heatmap" data-testid="category-brand-heatmap">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-ocean-muted">
        <LegendCell style={binStyles["strong-below"]} label="15%+ below peers" />
        <LegendCell style={binStyles["below"]} label="5–15% below" />
        <LegendCell style={binStyles["at-par"]} label="within 5% (at par)" />
        <LegendCell style={binStyles["above"]} label="5–15% above" />
        <LegendCell style={binStyles["strong-above"]} label="15%+ above peers" />
        <LegendCell style={noPeerStyle} label="priced, but no competitor here to compare to" />
        <LegendCell style={binStyles["no-data"]} label="not sold in this category" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface-2 p-1 text-left font-normal text-ocean-muted">Category</th>
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
                <th scope="row" className="sticky left-0 bg-surface-2 p-1 text-left font-normal text-ocean-muted">
                  {row.category}
                </th>
                {row.cells.map((cell) => {
                  const style = cell.status === "priced" ? binStyles[heatmapBin(cell.indexValue)] : cell.status === "no-peer" ? noPeerStyle : binStyles["no-data"];
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
