import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoryPositioning } from "./CategoryPositioning";

describe("CategoryPositioning", () => {
  it("renders without crashing for a set of category rows", () => {
    render(
      <CategoryPositioning
        rows={[
          { category: "Hot", avgIndex: 120, deviation: 20, direction: "above" },
          { category: "Cold", avgIndex: 85, deviation: -15, direction: "below" },
        ]}
      />
    );

    expect(screen.getByTestId("category-positioning")).toBeInTheDocument();
  });
});
