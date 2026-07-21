import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoryBrandHeatmap } from "./CategoryBrandHeatmap";

describe("CategoryBrandHeatmap", () => {
  it("renders a row per category and a column per brand, with the own brand marked", () => {
    render(
      <CategoryBrandHeatmap
        rows={[
          {
            category: "Hot",
            cells: [
              { brand: "Stories", indexValue: 92, avgPriceLbp: 300000, productCount: 2 },
              { brand: "Espresso Lab", indexValue: 108, avgPriceLbp: 350000, productCount: 1 },
            ],
          },
        ]}
        brands={["Stories", "Espresso Lab"]}
        ownBrand="Stories"
      />
    );

    expect(screen.getByTestId("category-brand-heatmap")).toBeInTheDocument();
    expect(screen.getByText("Hot")).toBeInTheDocument();
    expect(screen.getByText("Stories (client)")).toBeInTheDocument();
    expect(screen.getByText("92")).toBeInTheDocument();
    expect(screen.getByText("108")).toBeInTheDocument();
  });

  it("renders a dash for cells with no price data", () => {
    render(
      <CategoryBrandHeatmap
        rows={[
          {
            category: "Hot",
            cells: [{ brand: "Espresso Lab", indexValue: null, avgPriceLbp: null, productCount: 0 }],
          },
        ]}
        brands={["Espresso Lab"]}
        ownBrand="Stories"
      />
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
