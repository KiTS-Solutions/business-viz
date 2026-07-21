import type { ProductAnalytics } from "../data/types";

export function searchProducts(products: ProductAnalytics[], query: string): ProductAnalytics[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) => p.product.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
}

export interface ExplorerFilters {
  category: string | null;
  comparability: ProductAnalytics["comparability"] | null;
  outliersOnly: boolean;
}

export const DEFAULT_EXPLORER_FILTERS: ExplorerFilters = {
  category: null,
  comparability: null,
  outliersOnly: false,
};

export function filterProducts(products: ProductAnalytics[], filters: ExplorerFilters): ProductAnalytics[] {
  return products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.comparability && p.comparability !== filters.comparability) return false;
    if (filters.outliersOnly && !p.is_outlier) return false;
    return true;
  });
}

export type SortColumn = "product" | "category" | "own_price_lbp" | "price_index";
export type SortDirection = "asc" | "desc";

export function sortProducts(
  products: ProductAnalytics[],
  column: SortColumn,
  direction: SortDirection
): ProductAnalytics[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...products].sort((a, b) => {
    const av = a[column];
    const bv = b[column];
    if (av === null && bv === null) return 0;
    if (av === null) return 1; // nulls always sort last, regardless of direction
    if (bv === null) return -1;
    if (typeof av === "string" && typeof bv === "string") return sign * av.localeCompare(bv);
    if (typeof av === "number" && typeof bv === "number") return sign * (av - bv);
    return 0;
  });
}

export function uniqueCategories(products: ProductAnalytics[]): string[] {
  return Array.from(new Set(products.map((p) => p.category))).sort();
}
