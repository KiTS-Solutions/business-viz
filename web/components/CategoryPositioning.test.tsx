import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { CategoryPositioning } from "./CategoryPositioning";

describe("CategoryPositioning", () => {
  it("renders without crashing for a set of category rows", () => {
    render(
      <ThemeProvider>
      <CategoryPositioning
        rows={[
          {
            category: "Hot",
            avgIndex: 120,
            deviation: 20,
            direction: "above",
            countableProductCount: 5,
            totalProductCount: 6,
          },
          {
            category: "Cold",
            avgIndex: 85,
            deviation: -15,
            direction: "below",
            countableProductCount: 3,
            totalProductCount: 3,
          },
        ]}
      />
      </ThemeProvider>
    );

    expect(screen.getByTestId("category-positioning")).toBeInTheDocument();
  });
});
