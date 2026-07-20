"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryPositioningRow } from "@/lib/analytics/categoryPositioning";
import { SEMANTIC_COLORS } from "@/lib/theme/colors";

export function CategoryPositioning({ rows }: { rows: CategoryPositioningRow[] }) {
  return (
    <div className="h-[600px] w-full" aria-label="Category Positioning" data-testid="category-positioning">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 120, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}`} />
          <YAxis type="category" dataKey="category" width={160} />
          <ReferenceLine x={0} stroke="#2f5b6b" />
          <Tooltip formatter={(value) => {
            if (typeof value === "number") {
              return [`${value > 0 ? "+" : ""}${value} pts`, "vs. market"];
            }
            return value;
          }} />
          <Bar dataKey="deviation">
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
  );
}
