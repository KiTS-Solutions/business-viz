import { describe, it, expect } from "vitest";
import { formatReportPeriod, formatFullDate } from "./date";

describe("formatReportPeriod", () => {
  it("formats an ISO date as an unambiguous Month Year, dropping the fabricated day", () => {
    expect(formatReportPeriod("2026-03-01")).toBe("March 2026");
  });

  it("returns the original string unchanged if it doesn't match ISO date shape", () => {
    expect(formatReportPeriod("March 2026")).toBe("March 2026");
  });
});

describe("formatFullDate", () => {
  it("formats an ISO date as an unambiguous Month Day, Year — keeping day precision", () => {
    expect(formatFullDate("2026-07-20")).toBe("July 20, 2026");
  });

  it("does not zero-pad the day", () => {
    expect(formatFullDate("2026-07-05")).toBe("July 5, 2026");
  });

  it("returns the original string unchanged if it doesn't match ISO date shape", () => {
    expect(formatFullDate("July 20, 2026")).toBe("July 20, 2026");
  });
});
