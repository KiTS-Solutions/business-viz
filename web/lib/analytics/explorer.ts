import type { ProductAnalytics } from "../data/types";

export function searchProducts(products: ProductAnalytics[], query: string): ProductAnalytics[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) => p.product.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
}
