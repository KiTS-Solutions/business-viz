import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { DataExplorer } from "./DataExplorer";
import type { ProductAnalytics } from "@/lib/data/types";

function product(category: string, name: string): ProductAnalytics {
  return {
    category,
    product: name,
    prices_lbp: {},
    own_price_lbp: 300000,
    competitor_avg_lbp: 300000,
    price_index: 100,
    comparability: "high",
    tier: "Core",
    is_outlier: false,
    outlier_direction: null,
  };
}

describe("DataExplorer", () => {
  it("filters the visible rows as the user types in the search box", async () => {
    const user = userEvent.setup();
    render(
      <DataExplorer
        products={[product("Black Coffee", "Americano MEDIUM"), product("Pastries", "Croissant")]}
        fxRate={89600}
      />
    );

    expect(screen.getByText("Croissant")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search product or category…"), "americano");

    expect(screen.getByText("Americano MEDIUM")).toBeInTheDocument();
    expect(screen.queryByText("Croissant")).not.toBeInTheDocument();
  });
});
