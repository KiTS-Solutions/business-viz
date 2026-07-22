import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { CategoryPriceMap } from "./CategoryPriceMap";

describe("CategoryPriceMap", () => {
  it("renders without crashing and shows the category filter", () => {
    render(
      <ThemeProvider>
        <CategoryPriceMap
          rows={[
            {
              category: "Hot",
              brands: [
                { brand: "Stories", avgPriceLbp: 300000, productCount: 2 },
                { brand: "Espresso Lab", avgPriceLbp: 350000, productCount: 1 },
              ],
              competitorMinLbp: 350000,
              competitorMaxLbp: 350000,
            },
          ]}
          fxRate={89600}
          ownBrand="Stories"
        />
      </ThemeProvider>
    );

    expect(screen.getByTestId("category-price-map")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByText("Stories")).toBeInTheDocument();
    expect(screen.getByText("Espresso Lab")).toBeInTheDocument();
  });
});
