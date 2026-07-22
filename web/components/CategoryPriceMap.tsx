"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { CategoryPriceMapRow } from "@/lib/analytics/positioningMap";
import { filterCategoryPriceMap } from "@/lib/analytics/positioningMap";
import { themedBrandColors, themedChartColors, themedContextColor } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeContext";
import { formatDualCurrency } from "@/lib/format/currency";

const INK = { light: "#1f4d3d", dark: "#e7f3ee" };
const OWN_BRAND_STROKE = { light: "#1a1a1a", dark: "#f4f9f6" };

interface PricePoint {
  category: string;
  categoryIndex: number;
  brand: string;
  avgPriceLbp: number;
  productCount: number;
  isOwnBrand: boolean;
}

function categoryIndexOf(category: string, rows: CategoryPriceMapRow[]): number {
  return rows.findIndex((r) => r.category === category);
}

// Custom tooltip content — the built-in Recharts Tooltip `formatter` renders
// one row per axis dataKey (X and Y both have a `name`), which duplicated
// every point's price/brand. This renders exactly one line per hovered dot.
function PointTooltip({
  active,
  payload,
  fxRate,
}: {
  active?: boolean;
  payload?: Array<{ payload: PricePoint }>;
  fxRate: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-ocean/10 bg-surface-2 px-3 py-2 text-sm shadow-md">
      <p className={point.isOwnBrand ? "font-semibold text-ocean" : "text-ocean-muted"}>{point.brand}</p>
      <p className="text-ocean-muted">{formatDualCurrency(point.avgPriceLbp, fxRate)}</p>
      <p className="text-xs text-ocean-muted">
        {point.productCount} item{point.productCount === 1 ? "" : "s"} averaged
      </p>
    </div>
  );
}

export function CategoryPriceMap({
  rows,
  fxRate,
  ownBrand,
}: {
  rows: CategoryPriceMapRow[];
  fxRate: number;
  ownBrand: string;
}) {
  const { theme } = useTheme();
  const brandColors = themedBrandColors(theme);
  const chartColors = themedChartColors(theme);
  const contextColor = themedContextColor(theme);
  const ink = theme === "dark" ? INK.dark : INK.light;
  const ownBrandStroke = theme === "dark" ? OWN_BRAND_STROKE.dark : OWN_BRAND_STROKE.light;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const visibleRows = useMemo(
    () => filterCategoryPriceMap(rows, selectedCategory),
    [rows, selectedCategory]
  );

  // Indexed against visibleRows (what's actually displayed), not the full
  // rows list — using the full-list index left a single filtered category
  // positioned wherever it happened to sit in the unfiltered 25-row order
  // (e.g. row 20 of 25), so the Y-axis auto-scaled to a near-empty 0-25
  // range instead of tightly fitting the one visible row.
  const points: PricePoint[] = useMemo(
    () =>
      visibleRows.flatMap((row) =>
        row.brands.map((b) => ({
          category: row.category,
          categoryIndex: categoryIndexOf(row.category, visibleRows),
          brand: b.brand,
          avgPriceLbp: b.avgPriceLbp,
          productCount: b.productCount,
          isOwnBrand: b.brand === ownBrand,
        }))
      ),
    [visibleRows, ownBrand]
  );

  const rangeBands = visibleRows
    .filter((r) => r.competitorMinLbp !== null && r.competitorMaxLbp !== null)
    .map((r) => {
      const idx = categoryIndexOf(r.category, visibleRows);
      return { category: r.category, y1: idx - 0.32, y2: idx + 0.32, x1: r.competitorMinLbp!, x2: r.competitorMaxLbp! };
    });

  const competitorBrands = Array.from(
    new Set(rows.flatMap((r) => r.brands.map((b) => b.brand)).filter((b) => b !== ownBrand))
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label htmlFor="category-map-filter" className="text-sm text-ocean-muted">
          Category
        </label>
        <select
          id="category-map-filter"
          value={selectedCategory ?? ""}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="rounded-md border border-ocean/20 px-2 py-1 text-sm"
        >
          <option value="">All categories</option>
          {rows.map((r) => (
            <option key={r.category} value={r.category}>
              {r.category}
            </option>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap items-center gap-4 text-xs text-ocean-muted">
          <LegendChip color={brandColors.stories} label={ownBrand} bold />
          {competitorBrands.map((b) => (
            <LegendChip key={b} color={chartColors[b] ?? contextColor} label={b} />
          ))}
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-sm bg-ocean/10" />
            Competitor price range
          </span>
        </div>
      </div>

      {/* Fixed 140px left margin for category labels gets crushed unreadable
          below ~600px viewport width — Recharts doesn't reflow it. Give the
          chart a real minimum width and let this wrapper scroll
          horizontally, same pattern as the Data Explorer/heatmap tables. */}
      <div className="overflow-x-auto" aria-label="Category Price Positioning Map" data-testid="category-price-map">
        <div style={{ height: Math.max(180, visibleRows.length * 36 + 80), minWidth: 600 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 140, right: 24, top: 16, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="avgPriceLbp"
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                tick={{ fill: ink, fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="categoryIndex"
                domain={[-0.5, Math.max(0, visibleRows.length - 1) + 0.5]}
                tickFormatter={(v: number) => visibleRows[v]?.category ?? ""}
                ticks={visibleRows.map((r) => categoryIndexOf(r.category, visibleRows))}
                width={130}
                interval={0}
                tick={{ fill: ink, fontSize: 12 }}
              />
              <ZAxis range={[60, 60]} />
              {rangeBands.map((band) => (
                <ReferenceArea
                  key={band.category}
                  x1={band.x1}
                  x2={band.x2}
                  y1={band.y1}
                  y2={band.y2}
                  fill={ink}
                  fillOpacity={0.08}
                  stroke="none"
                  ifOverflow="visible"
                />
              ))}
              <Tooltip content={<PointTooltip fxRate={fxRate} />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={points} shape="circle">
                {points.map((p, i) => (
                  <Cell
                    key={`${p.category}-${p.brand}-${i}`}
                    fill={p.isOwnBrand ? brandColors.stories : chartColors[p.brand] ?? contextColor}
                    stroke={p.isOwnBrand ? ownBrandStroke : "none"}
                    strokeWidth={p.isOwnBrand ? 1.5 : 0}
                    r={p.isOwnBrand ? 7 : 5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function LegendChip({ color, label, bold }: { color: string; label: string; bold?: boolean }) {
  return (
    <span className={`flex items-center gap-1 ${bold ? "font-semibold text-ocean" : ""}`}>
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
