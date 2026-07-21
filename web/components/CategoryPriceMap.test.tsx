import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoryPriceMap } from "./CategoryPriceMap";

describe("CategoryPriceMap", () => {
  it("renders without crashing and shows the category filter", () => {
    render(
      <CategoryPriceMap
        rows={[
          {
            category: "Hot",
            brands: [
              { brand: "Stories", avgPriceLbp: 300000, productCount: 2 },
              { brand: "Espresso Lab", avgPriceLbp: 350000, productCount: 1 },
            ],
          },
        ]}
        fxRate={89600}
        ownBrand="Stories"
      />
    );

    expect(screen.getByTestId("category-price-map")).toBeInTheDocument();
    expect(screen.getByLabelText("Category:")).toBeInTheDocument();
  });
});
