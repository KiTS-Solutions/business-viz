import type { CupSizeTable, CupSizeTier } from "@/lib/data/cupSizeTypes";

const TIER_LABELS: Record<CupSizeTier, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
  TO_GO: "To Go",
  DINE_IN: "Dine In",
};

function formatOunces(value: number | string | null): string {
  if (value === null) return "—";
  return `${value} oz`;
}

export function CupSizeComparison({ table, ownBrand }: { table: CupSizeTable; ownBrand: string }) {
  const brands = table.rows.map((r) => r.brand);

  return (
    <div aria-label="Cup Size Comparison" data-testid="cup-size-comparison">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="p-1 text-left font-normal text-ocean-muted">Size</th>
              {brands.map((brand) => (
                <th
                  key={brand}
                  className={`p-1 text-center font-normal ${brand === ownBrand ? "font-semibold text-ocean" : "text-ocean-muted"}`}
                >
                  {brand}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.sizes.map((tier) => (
              <tr key={tier}>
                <th scope="row" className="p-1 text-left font-normal text-ocean-muted">
                  {TIER_LABELS[tier]}
                </th>
                {table.rows.map((row) => (
                  <td
                    key={row.brand}
                    className={`p-1.5 text-center tabular-nums ${row.brand === ownBrand ? "bg-ocean/5 font-semibold ring-2 ring-ocean/40" : ""}`}
                  >
                    {formatOunces(row[tier])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
