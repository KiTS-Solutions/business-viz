"use client";

import { useMemo, useState } from "react";
import type { ProductAnalytics } from "@/lib/data/types";
import { searchProducts } from "@/lib/analytics/explorer";
import { formatDualCurrency } from "@/lib/format/currency";

export function DataExplorer({ products, fxRate }: { products: ProductAnalytics[]; fxRate: number }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => searchProducts(products, query), [products, query]);

  return (
    <section aria-label="Full Data Explorer">
      <input
        type="search"
        placeholder="Search product or category…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3 w-full rounded-md border border-ocean/20 px-3 py-2 text-sm"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ocean/60">
              <th className="py-2">Category</th>
              <th className="py-2">Product</th>
              <th className="py-2">Stories Price</th>
              <th className="py-2">Index</th>
              <th className="py-2">Comparability</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={`${p.category}-${p.product}`} className="border-t border-ocean/10">
                <td className="py-2">{p.category}</td>
                <td className="py-2">{p.product}</td>
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
