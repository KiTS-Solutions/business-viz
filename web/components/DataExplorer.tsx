"use client";

import { useMemo, useState } from "react";
import type { ProductAnalytics } from "@/lib/data/types";
import {
  searchProducts,
  filterProducts,
  sortProducts,
  uniqueCategories,
  DEFAULT_EXPLORER_FILTERS,
  type SortColumn,
  type SortDirection,
} from "@/lib/analytics/explorer";
import { formatDualCurrency } from "@/lib/format/currency";

export function DataExplorer({ products, fxRate }: { products: ProductAnalytics[]; fxRate: number }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_EXPLORER_FILTERS);
  const [sortColumn, setSortColumn] = useState<SortColumn>("category");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const categories = useMemo(() => uniqueCategories(products), [products]);

  const rows = useMemo(() => {
    const searched = searchProducts(products, query);
    const filtered = filterProducts(searched, filters);
    return sortProducts(filtered, sortColumn, sortDirection);
  }, [products, query, filters, sortColumn, sortDirection]);

  function handleSort(column: SortColumn) {
    if (column === sortColumn) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  function sortIndicator(column: SortColumn) {
    if (column !== sortColumn) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  return (
    <section aria-label="Full Data Explorer">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search product or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-[220px] flex-1 rounded-md border border-ocean/20 px-3 py-2 text-sm"
        />
        <select
          aria-label="Filter by category"
          value={filters.category ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || null }))}
          className="rounded-md border border-ocean/20 px-2 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by comparability"
          value={filters.comparability ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              comparability: (e.target.value || null) as ProductAnalytics["comparability"] | null,
            }))
          }
          className="rounded-md border border-ocean/20 px-2 py-2 text-sm"
        >
          <option value="">All comparability</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-ocean/70">
          <input
            type="checkbox"
            checked={filters.outliersOnly}
            onChange={(e) => setFilters((f) => ({ ...f, outliersOnly: e.target.checked }))}
          />
          Outliers only
        </label>
        <span className="text-xs text-ocean/50">
          {rows.length} of {products.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ocean/60">
              <SortableHeader label="Category" column="category" onSort={handleSort} indicator={sortIndicator("category")} />
              <SortableHeader label="Product" column="product" onSort={handleSort} indicator={sortIndicator("product")} />
              <SortableHeader
                label="Stories Price"
                column="own_price_lbp"
                onSort={handleSort}
                indicator={sortIndicator("own_price_lbp")}
              />
              <SortableHeader label="Index" column="price_index" onSort={handleSort} indicator={sortIndicator("price_index")} />
              <th className="py-2">Comparability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={`${p.category}-${p.product}`}
                className={`border-t border-ocean/10 ${p.is_outlier ? "bg-amber-50" : ""}`}
              >
                <td className="py-2">{p.category}</td>
                <td className="py-2">
                  {p.product}
                  {p.is_outlier && (
                    <span className="ml-1" title={p.outlier_direction ?? undefined}>
                      {p.outlier_direction === "overpriced" ? "▲" : "▼"}
                    </span>
                  )}
                </td>
                <td className="py-2">
                  {p.own_price_lbp !== null ? formatDualCurrency(p.own_price_lbp, fxRate) : "—"}
                </td>
                <td className="py-2">{p.price_index ?? "—"}</td>
                <td className="py-2">{p.comparability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SortableHeader({
  label,
  column,
  onSort,
  indicator,
}: {
  label: string;
  column: SortColumn;
  onSort: (column: SortColumn) => void;
  indicator: string;
}) {
  return (
    <th className="py-2">
      <button type="button" onClick={() => onSort(column)} className="font-inherit">
        {label}
        {indicator}
      </button>
    </th>
  );
}
