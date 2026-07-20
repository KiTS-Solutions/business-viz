import { describe, it, expect } from "vitest";
import { formatLbp, formatUsd, formatDualCurrency } from "./currency";

describe("currency formatting", () => {
  it("formats LBP with thousands separators and a unit suffix", () => {
    expect(formatLbp(350000)).toBe("350,000 LBP");
  });

  it("formats USD with two decimal places", () => {
    expect(formatUsd(3.348)).toBe("$3.35");
  });

  it("formats LBP as primary with USD as a parenthetical equivalent", () => {
    expect(formatDualCurrency(350000, 89600)).toBe("350,000 LBP ($3.91)");
  });
});
