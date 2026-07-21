"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
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
import { BRAND_COLORS, CHART_COLORS } from "@/lib/theme/colors";
import { formatDualCurrency } from "@/lib/format/currency";

const CATEGORY_ORDER_KEY = (category: string, rows: CategoryPriceMapRow[]) =>
  rows.findIndex((r) => r.category === category);

export function CategoryPriceMap({
  rows,
  fxRate,
  ownBrand,
}: {
  rows: CategoryPriceMapRow[];
  fxRate: number;
  ownBrand: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const visibleRows = useMemo(
    () => filterCategoryPriceMap(rows, selectedCategory),
    [rows, selectedCategory]
  );

  const points = useMemo(
    () =>
      visibleRows.flatMap((row) =>
        row.brands.map((b) => ({
          category: row.category,
          categoryIndex: CATEGORY_ORDER_KEY(row.category, rows),
          brand: b.brand,
          avgPriceLbp: b.avgPriceLbp,
          productCount: b.productCount,
          isOwnBrand: b.brand === ownBrand,
        }))
      ),
    [visibleRows, rows, ownBrand]
  );

  const brands = Array.from(new Set(points.map((p) => p.brand))).filter((b) => b !== ownBrand);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor="category-map-filter" className="text-sm text-ocean/70">
          Category:
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
        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-ocean/70">
          <LegendChip color={BRAND_COLORS.stories} label={`${ownBrand} (us)`} />
          {brands.map((b) => (
            <LegendChip key={b} color={CHART_COLORS[b] ?? "#94a3b8"} label={b} />
          ))}
        </div>
      </div>

      <div
        className={selectedCategory ? "h-[260px] w-full" : "h-[900px] w-full"}
        aria-label="Category Price Positioning Map"
        data-testid="category-price-map"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ left: 140, right: 24, top: 16, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="avgPriceLbp"
              name="Avg. price"
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            />
            <YAxis
              type="number"
              dataKey="categoryIndex"
              name="Category"
              tickFormatter={(v: number) => rows[v]?.category ?? ""}
              ticks={visibleRows.map((r) => CATEGORY_ORDER_KEY(r.category, rows))}
              width={130}
              interval={0}
            />
            <ZAxis range={[70, 70]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value, _name, entry) => {
                const brand =
                  typeof entry === "object" && entry && "payload" in entry
                    ? (entry.payload as { brand?: string } | undefined)?.brand ?? ""
                    : "";
                return [typeof value === "number" ? formatDualCurrency(value, fxRate) : "", brand];
              }}
              labelFormatter={() => ""}
            />
            <Scatter data={points} shape="circle">
              {points.map((p, i) => (
                <Cell
                  key={`${p.category}-${p.brand}-${i}`}
                  fill={p.isOwnBrand ? BRAND_COLORS.stories : CHART_COLORS[p.brand] ?? "#94a3b8"}
                  stroke={p.isOwnBrand ? "#000" : "none"}
                  strokeWidth={p.isOwnBrand ? 1 : 0}
                  r={p.isOwnBrand ? 7 : 5}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
