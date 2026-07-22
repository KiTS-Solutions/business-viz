"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { ProductAnalytics } from "@/lib/data/types";
import {
  searchProducts,
  filterProducts,
  sortProducts,
  uniqueCategories,
  paginate,
  DEFAULT_EXPLORER_FILTERS,
  type SortColumn,
  type SortDirection,
} from "@/lib/analytics/explorer";
import { formatDualCurrency } from "@/lib/format/currency";
import { themedBrandColors, themedSemanticColors } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeContext";
import { IndexDeviationBadge } from "@/components/IndexDeviationBadge";

const PAGE_SIZE = 25;

const TIER_STYLE: Record<string, string> = {
  Value: "bg-ocean/10 text-ocean",
  Core: "bg-ocean/30 text-ocean",
  Premium: "bg-brand-surface text-white",
};

const COMPARABILITY_STYLE: Record<string, string> = {
  high: "bg-brand-surface text-white",
  medium: "border border-ocean/40 text-ocean",
  low: "border border-ocean/20 text-ocean-muted",
};

export function DataExplorer({
  products,
  fxRate,
  ownBrand,
}: {
  products: ProductAnalytics[];
  fxRate: number;
  ownBrand: string;
}) {
  const { theme } = useTheme();
  const brandColors = themedBrandColors(theme);
  const semanticColors = themedSemanticColors(theme);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_EXPLORER_FILTERS);
  const [sortColumn, setSortColumn] = useState<SortColumn>("category");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const categories = useMemo(() => uniqueCategories(products), [products]);

  const filteredSorted = useMemo(() => {
    const searched = searchProducts(products, query);
    const filtered = filterProducts(searched, filters);
    return sortProducts(filtered, sortColumn, sortDirection);
  }, [products, query, filters, sortColumn, sortDirection]);

  // Reset to page 1 whenever the result set changes shape (new search/filter/sort).
  useEffect(() => {
    setPage(1);
  }, [query, filters, sortColumn, sortDirection]);

  const pageResult = paginate(filteredSorted, page, PAGE_SIZE);

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
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="mb-3 rounded-full border border-ocean/20 px-4 py-1.5 text-sm text-ocean"
      >
        {isOpen ? "Hide Table" : "Show Table"} <span className="text-ocean-muted">({products.length} items)</span>
      </button>
      {isOpen && (
      <>
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
        <label className="flex items-center gap-1.5 text-sm text-ocean-muted">
          <input
            type="checkbox"
            checked={filters.outliersOnly}
            onChange={(e) => setFilters((f) => ({ ...f, outliersOnly: e.target.checked }))}
          />
          Outliers only
        </label>
        <span className="text-xs text-ocean-muted">
          {pageResult.totalItems} of {products.length}
        </span>
      </div>
      <p className="mb-2 text-xs text-ocean-muted">
        * = low comparability (only 1 competitor priced) — index shown for reference, not a reliable market read.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ocean-muted">
              <th className="py-2" aria-hidden="true" />
              <SortableHeader label="Category" column="category" onSort={handleSort} indicator={sortIndicator("category")} />
              <SortableHeader label="Product" column="product" onSort={handleSort} indicator={sortIndicator("product")} />
              <SortableHeader
                label={`${ownBrand} Price`}
                column="own_price_lbp"
                onSort={handleSort}
                indicator={sortIndicator("own_price_lbp")}
              />
              <SortableHeader label="Index" column="price_index" onSort={handleSort} indicator={sortIndicator("price_index")} />
              <SortableHeader label="Tier" column="tier" onSort={handleSort} indicator={sortIndicator("tier")} />
              <th className="py-2">Comparability</th>
            </tr>
          </thead>
          <tbody>
            {pageResult.items.map((p) => {
              const key = `${p.category}-${p.product}`;
              const isExpanded = expandedKey === key;
              return (
                <Fragment key={key}>
                  <tr
                    className={`cursor-pointer border-t border-ocean/10 hover:bg-ocean/5 ${p.is_outlier ? "bg-amber-50 dark:bg-amber-950" : ""}`}
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                  >
                    <td className="py-2 pl-1 text-ocean-muted">{isExpanded ? "▾" : "▸"}</td>
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
                    <td className="py-2">
                      <IndexBar value={p.price_index} comparability={p.comparability} semanticColors={semanticColors} />
                    </td>
                    <td className="py-2">
                      {p.tier ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs ${TIER_STYLE[p.tier]}`}>{p.tier}</span>
                      ) : (
                        <span className="text-ocean-muted">—</span>
                      )}
                    </td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${COMPARABILITY_STYLE[p.comparability]}`}>
                        {p.comparability}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-t border-ocean/5 bg-ocean/5">
                      <td colSpan={7} className="px-4 py-3">
                        <p className="mb-2 text-xs font-semibold text-ocean-muted">All brand prices for this item</p>
                        <div className="flex flex-wrap gap-4">
                          {Object.entries(p.prices_lbp).map(([brand, price]) => (
                            <div key={brand} className={brand === ownBrand ? "font-semibold" : ""}>
                              <p className="text-xs text-ocean-muted">{brand}</p>
                              <p style={{ color: brand === ownBrand ? brandColors.stories : undefined }}>
                                {formatDualCurrency(price, fxRate)}
                              </p>
                            </div>
                          ))}
                          {Object.keys(p.prices_lbp).length === 0 && (
                            <p className="text-xs text-ocean-muted">No brand priced this item.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageResult.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-ocean-muted">
          <button
            type="button"
            onClick={() => setPage((p) => p - 1)}
            disabled={pageResult.currentPage <= 1}
            className="rounded-md border border-ocean/20 px-3 py-1 disabled:opacity-30"
          >
            Previous
          </button>
          <span>
            Page {pageResult.currentPage} of {pageResult.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={pageResult.currentPage >= pageResult.totalPages}
            className="rounded-md border border-ocean/20 px-3 py-1 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
      </>
      )}
    </section>
  );
}

function IndexBar({
  value,
  comparability,
  semanticColors,
}: {
  value: number | null;
  comparability: ProductAnalytics["comparability"];
  semanticColors: { overpriced: string; underpriced: string };
}) {
  if (value === null) return <span className="text-ocean-muted">—</span>;

  // Low comparability (0-1 competitors priced) means this index isn't a
  // reliable market read — the pipeline itself excludes these from category
  // averages and outlier flags. Showing them with the same bold color/bar as
  // a reliable index overstates confidence a single data point doesn't earn.
  const isReliable = comparability !== "low";
  const deviation = value - 100;
  const clamped = Math.max(-30, Math.min(30, deviation));
  const widthPct = (Math.abs(clamped) / 30) * 50; // half-bar max width on either side of center
  const color = deviation >= 0 ? semanticColors.overpriced : semanticColors.underpriced;

  return (
    <div className="flex items-center gap-2" title={isReliable ? undefined : "Low comparability — based on only 1 competitor, not a reliable market read"}>
      <span className={`w-9 tabular-nums ${isReliable ? "" : "text-ocean-muted"}`}>
        {Math.round(value)}
        {!isReliable && "*"}
      </span>
      <IndexDeviationBadge value={isReliable ? value : null} className="w-11" />
      <div className="relative h-2 w-16 rounded-sm bg-ocean/10">
        <div className="absolute left-1/2 top-0 h-full w-px bg-ocean/30" />
        <div
          className="absolute top-0 h-full rounded-sm"
          style={{
            width: `${widthPct}%`,
            backgroundColor: color,
            opacity: isReliable ? 1 : 0.35,
            left: deviation >= 0 ? "50%" : `${50 - widthPct}%`,
          }}
        />
      </div>
    </div>
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
