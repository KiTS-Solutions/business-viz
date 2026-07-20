import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ExecutiveSummary } from "./ExecutiveSummary";

describe("ExecutiveSummary", () => {
  it("renders the four KPI tiles", () => {
    render(
      <ExecutiveSummary
        kpis={{
          overallAvgIndex: 97.5,
          categoriesAboveMarket: 5,
          categoriesBelowMarket: 8,
          coveragePct: 62.3,
          topOverIndexed: [],
          topUnderIndexed: [],
        }}
      />
    );

    expect(screen.getByText("97.5")).toBeInTheDocument();
    expect(screen.getByText("Categories Above Market")).toBeInTheDocument();
    expect(screen.getByText("62.3%")).toBeInTheDocument();
  });
});
