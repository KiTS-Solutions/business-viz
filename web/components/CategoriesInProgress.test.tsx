import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoriesInProgress } from "./CategoriesInProgress";

describe("CategoriesInProgress", () => {
  it("renders one card per pending category, no numbers or charts", () => {
    render(<CategoriesInProgress categories={["Salads", "Pizza"]} />);
    expect(screen.getByText("Salads")).toBeInTheDocument();
    expect(screen.getByText("Pizza")).toBeInTheDocument();
    expect(screen.getAllByText("Data not yet available")).toHaveLength(2);
  });
});
