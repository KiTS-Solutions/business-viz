import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContextBar } from "./ContextBar";

describe("ContextBar", () => {
  it("shows client, an unambiguous period, and FX rate with source", () => {
    render(
      <ContextBar
        meta={{
          client: "Stories",
          report_date: "2026-03-01",
          currency: "LBP",
          fx_usd_rate: 89600,
          fx_rate_date: "2026-07-20",
          fx_source: "lira-rate.com / lbprate.com market average",
          own_brand: "Stories",
          competitors: ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"],
        }}
      />
    );

    expect(screen.getByText(/Stories/)).toBeInTheDocument();
    expect(screen.getByText(/March 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/2026-03-01/)).not.toBeInTheDocument();
    expect(screen.getByText(/89,600 LBP\/USD/)).toBeInTheDocument();
    expect(screen.getByText(/July 20, 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/2026-07-20/)).not.toBeInTheDocument();
    expect(screen.getByText(/lira-rate.com/)).toBeInTheDocument();
  });
});
