"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryPositioningRow } from "@/lib/analytics/categoryPositioning";
import { SEMANTIC_COLORS } from "@/lib/theme/colors";

function formatDeviation(v: number): string {
  return `${v > 0 ? "+" : ""}${v}`;
}

export function CategoryPositioning({ rows }: { rows: CategoryPositioningRow[] }) {
  const rowHeight = 26;
  const chartHeight = Math.max(320, rows.length * rowHeight + 60);

  return (
    <div className="overflow-x-auto" aria-label="Category Positioning" data-testid="category-positioning">
      {/* Fixed pixel axis margins (labels + value labels) get crushed
          unreadable if the chart is forced to shrink below ~600px on a
          narrow viewport — Recharts doesn't reflow them. Rather than let
          that happen silently, give the chart a real minimum width and let
          the wrapper scroll horizontally, the same pattern already used for
          the Data Explorer and heatmap tables. */}
      <div style={{ height: chartHeight, minWidth: 600 }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 130, right: 40, top: 8, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={formatDeviation}>
              <Label value="Deviation from market average (index points)" position="bottom" offset={0} style={{ fontSize: 12, fill: "#1f4d3d99" }} />
            </XAxis>
            <YAxis type="category" dataKey="category" width={160} tick={{ fontSize: 12 }} />
            <ReferenceLine x={0} stroke="#1f4d3d" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const row = payload[0].payload as CategoryPositioningRow;
                return (
                  <div className="rounded-md border border-ocean/10 bg-white px-3 py-2 text-sm shadow-md">
                    <p className="font-semibold text-ocean">{row.category}</p>
                    <p className="text-ocean-muted">
                      {formatDeviation(row.deviation)} pts vs. market (index {row.avgIndex})
                    </p>
                    <p className="text-xs text-ocean-muted">
                      Based on {row.countableProductCount} of {row.totalProductCount} products with reliable
                      competitor data
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="deviation">
              <LabelList
                dataKey="deviation"
                position="right"
                formatter={(v) => (typeof v === "number" ? formatDeviation(v) : "")}
                style={{ fontSize: 11, fill: "#1f4d3d" }}
              />
              {rows.map((row) => (
                <Cell
                  key={row.category}
                  fill={
                    row.direction === "above"
                      ? SEMANTIC_COLORS.overpriced
                      : row.direction === "below"
                      ? SEMANTIC_COLORS.underpriced
                      : "#94a3b8"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
