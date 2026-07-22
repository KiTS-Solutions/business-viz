import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { CategoryBrandHeatmap } from "./CategoryBrandHeatmap";

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("CategoryBrandHeatmap", () => {
  it("renders a row per category and a column per brand, with the own brand marked", () => {
    renderWithTheme(
      <CategoryBrandHeatmap
        rows={[
          {
            category: "Hot",
            cells: [
              { brand: "Stories", indexValue: 92, avgPriceLbp: 300000, productCount: 2, status: "priced" },
              { brand: "Espresso Lab", indexValue: 108, avgPriceLbp: 350000, productCount: 1, status: "priced" },
            ],
          },
        ]}
        brands={["Stories", "Espresso Lab"]}
        ownBrand="Stories"
      />
    );

    expect(screen.getByTestId("category-brand-heatmap")).toBeInTheDocument();
    expect(screen.getByText("Hot")).toBeInTheDocument();
    expect(screen.getByText("Stories")).toBeInTheDocument();
    expect(screen.getByText("92")).toBeInTheDocument();
    expect(screen.getByText("108")).toBeInTheDocument();
  });

  it("renders a dash for cells with no priced item at all", () => {
    renderWithTheme(
      <CategoryBrandHeatmap
        rows={[
          {
            category: "Hot",
            cells: [{ brand: "Espresso Lab", indexValue: null, avgPriceLbp: null, productCount: 0, status: "not-priced" }],
          },
        ]}
        brands={["Espresso Lab"]}
        ownBrand="Stories"
      />
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the actual price (not a blank dash) for a priced item with no peer to compare against", () => {
    renderWithTheme(
      <CategoryBrandHeatmap
        rows={[
          {
            category: "Frozen Yogurt",
            cells: [
              { brand: "Stories", indexValue: null, avgPriceLbp: 250000, productCount: 42, status: "no-peer" },
            ],
          },
        ]}
        brands={["Stories"]}
        ownBrand="Stories"
      />
    );

    // 250000 -> "250k", not a bare dash — this is the exact case the review flagged.
    expect(screen.getByText("250k")).toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });
});
