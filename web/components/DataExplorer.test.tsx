import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { DataExplorer } from "./DataExplorer";
import type { ProductAnalytics } from "@/lib/data/types";

function product(category: string, name: string, overrides: Partial<ProductAnalytics> = {}): ProductAnalytics {
  return {
    category,
    product: name,
    prices_lbp: { Stories: 300000, "Espresso Lab": 320000 },
    own_price_lbp: 300000,
    competitor_avg_lbp: 300000,
    price_index: 100,
    comparability: "high",
    tier: "Core",
    is_outlier: false,
    outlier_direction: null,
    ...overrides,
  };
}

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("DataExplorer", () => {
  it("hides the table behind a 'Show Table' toggle by default", () => {
    renderWithTheme(
      <DataExplorer products={[product("Black Coffee", "Americano MEDIUM")]} fxRate={89600} ownBrand="Stories" />
    );
    expect(screen.queryByText("Americano MEDIUM")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Show Table/ })).toBeInTheDocument();
  });

  it("filters the visible rows as the user types in the search box", async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <DataExplorer
        products={[product("Black Coffee", "Americano MEDIUM"), product("Pastries", "Croissant")]}
        fxRate={89600}
        ownBrand="Stories"
      />
    );
    await user.click(screen.getByRole("button", { name: /Show Table/ }));

    expect(screen.getByText("Croissant")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search product or category…"), "americano");

    expect(screen.getByText("Americano MEDIUM")).toBeInTheDocument();
    expect(screen.queryByText("Croissant")).not.toBeInTheDocument();
  });

  it("expands a row on click to show every brand's price for that item", async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <DataExplorer products={[product("Black Coffee", "Americano MEDIUM")]} fxRate={89600} ownBrand="Stories" />
    );
    await user.click(screen.getByRole("button", { name: /Show Table/ }));

    expect(screen.queryByText("All brand prices for this item")).not.toBeInTheDocument();

    await user.click(screen.getByText("Americano MEDIUM"));

    expect(screen.getByText("All brand prices for this item")).toBeInTheDocument();
    expect(screen.getByText("Espresso Lab")).toBeInTheDocument();
  });

  it("paginates beyond the first page of results", async () => {
    const user = userEvent.setup();
    const manyProducts = Array.from({ length: 30 }, (_, i) => product("Hot", `Item ${String(i).padStart(2, "0")}`));
    renderWithTheme(<DataExplorer products={manyProducts} fxRate={89600} ownBrand="Stories" />);
    await user.click(screen.getByRole("button", { name: /Show Table/ }));

    expect(screen.getByText("Item 00")).toBeInTheDocument();
    expect(screen.queryByText("Item 26")).not.toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Item 26")).toBeInTheDocument();
    expect(screen.queryByText("Item 00")).not.toBeInTheDocument();
  });

  it("visually flags a low-comparability index as unreliable instead of showing it at full weight", async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <DataExplorer
        products={[product("Hot", "Almond Milk LARGE", { comparability: "low", price_index: 233 })]}
        fxRate={89600}
        ownBrand="Stories"
      />
    );
    await user.click(screen.getByRole("button", { name: /Show Table/ }));

    expect(screen.getByText("233*")).toBeInTheDocument();
  });
});
