import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Methodology } from "./Methodology";
import type { ReportMeta, DataQualityWarning } from "@/lib/data/types";

const meta: ReportMeta = {
  client: "Stories",
  report_date: "2026-03-01",
  currency: "LBP",
  fx_usd_rate: 89600,
  fx_rate_date: "2026-07-20",
  fx_source: "lira-rate.com",
  own_brand: "Stories",
  competitors: ["Espresso Lab"],
  generated_from: "raw-data/Pricing.xlsx",
};

describe("Methodology", () => {
  it("explains the price index formula and data provenance", () => {
    render(<Methodology meta={meta} warnings={[]} />);
    expect(screen.getByText(/no prices were estimated, interpolated, or invented/)).toBeInTheDocument();
    expect(screen.getByText("Price Index")).toBeInTheDocument();
    expect(screen.getByText(/competitor-only average/)).toBeInTheDocument();
  });

  it("surfaces data quality warnings when present", () => {
    const warnings: DataQualityWarning[] = [
      { category: "Pastries", product: "CHOCOLATE ÉCLAIR", brand: "Espresso Lab", conflicting_prices_lbp: [500000, 400000] },
    ];
    render(<Methodology meta={meta} warnings={warnings} />);
    expect(screen.getByText(/CHOCOLATE ÉCLAIR/)).toBeInTheDocument();
    expect(screen.getByText(/500,000 LBP vs\. 400,000 LBP/)).toBeInTheDocument();
  });

  it("omits the data quality section when there are no warnings", () => {
    render(<Methodology meta={meta} warnings={[]} />);
    expect(screen.queryByText("Data quality notes")).not.toBeInTheDocument();
  });
});
