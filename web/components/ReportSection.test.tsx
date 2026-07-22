import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ReportSection } from "./ReportSection";
import { PresenterModeProvider } from "@/lib/presenter/PresenterModeContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { PresenterModeToggle } from "./PresenterModeToggle";
import type { PricingReport } from "@/lib/data/types";

function renderWithProviders(ui: React.ReactElement) {
  return render(<ThemeProvider><PresenterModeProvider>{ui}</PresenterModeProvider></ThemeProvider>);
}

function buildReport(): PricingReport {
  return {
    meta: {
      client: "Stories",
      report_date: "2026-07-22",
      currency: "LBP",
      fx_usd_rate: 89600,
      fx_rate_date: "2026-07-20",
      fx_source: "test",
      own_brand: "Stories",
      competitors: ["Pinkberry"],
    },
    products: [
      {
        category: "Frozen Yogurt",
        product: "Original Yogurt SMALL",
        prices_lbp: { Stories: 500000, Pinkberry: 450000 },
        own_price_lbp: 500000,
        competitor_avg_lbp: 450000,
        price_index: 111.1,
        comparability: "high",
        tier: "Core",
        is_outlier: false,
        outlier_direction: null,
      },
    ],
    categories: [
      { category: "Frozen Yogurt", product_count: 1, countable_product_count: 1, avg_price_index: 111.1 },
    ],
    data_quality_warnings: [],
  };
}

describe("ReportSection", () => {
  it("renders the group title and all five sub-views once explanations are shown", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <PresenterModeToggle />
        <ReportSection title="Frozen Yogurt Bar" report={buildReport()} />
      </>
    );

    await user.click(screen.getByRole("button", { name: "Show Explanations" }));

    expect(screen.getByRole("heading", { level: 2, name: "Frozen Yogurt Bar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Competitive Landscape at a Glance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Category Positioning" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Price Positioning Map" })).toBeInTheDocument();
    expect(screen.getByText("Findings & Recommendations")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Full Data Explorer" })).toBeInTheDocument();
    expect(screen.getByTestId("category-brand-heatmap")).toBeInTheDocument();
  });

  it("hides each sub-view's intro paragraph by default, while the sub-view's real content stays visible", () => {
    renderWithProviders(<ReportSection title="Frozen Yogurt Bar" report={buildReport()} />);

    expect(screen.queryByText(/Every category against every brand in one grid/)).not.toBeInTheDocument();
    expect(screen.queryByText(/competitor-only average in each category/)).not.toBeInTheDocument();
    expect(screen.queryByText(/average price per category/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Every priced line item, with search/)).not.toBeInTheDocument();

    // Headings and the actual chart content are unaffected — only the
    // explanatory prose paragraphs are behind the reveal.
    expect(screen.getByRole("heading", { level: 3, name: "Competitive Landscape at a Glance" })).toBeInTheDocument();
    expect(screen.getByTestId("category-brand-heatmap")).toBeInTheDocument();
  });

  it("renders extra content between Price Positioning Map and Full Data Explorer when provided", () => {
    renderWithProviders(
      <ReportSection
        title="Frozen Yogurt Bar"
        report={buildReport()}
        extra={<div data-testid="cup-size-slot">Cup sizes</div>}
      />
    );
    expect(screen.getByTestId("cup-size-slot")).toBeInTheDocument();
  });

  it("renders nothing extra when the extra prop is omitted", () => {
    renderWithProviders(<ReportSection title="Frozen Yogurt Bar" report={buildReport()} />);
    expect(screen.queryByTestId("cup-size-slot")).not.toBeInTheDocument();
  });
});
