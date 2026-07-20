import { describe, it, expect } from "vitest";
import { listReportSlugs, loadReport } from "./loadReport";

describe("loadReport", () => {
  it("lists the committed Stories March 2026 report", () => {
    const slugs = listReportSlugs();
    expect(slugs).toContain("stories-pricing-2026-03");
  });

  it("loads the report with the shape produced by the Python pipeline", () => {
    const report = loadReport("stories-pricing-2026-03");
    expect(report.meta.client).toBe("Stories");
    expect(report.products.length).toBe(583);
    expect(report.categories.length).toBe(25);
  });
});
