import { describe, it, expect } from "vitest";
import { cleanDisplayFileName } from "./filename";

describe("cleanDisplayFileName", () => {
  it("strips a download-duplicate ' (1)' suffix before the extension", () => {
    expect(cleanDisplayFileName("raw-data/Product Pricing Comparison March 2026 (1).xlsx")).toBe(
      "raw-data/Product Pricing Comparison March 2026.xlsx"
    );
  });

  it("leaves a file name with no duplicate suffix unchanged", () => {
    expect(cleanDisplayFileName("raw-data/Pricing.xlsx")).toBe("raw-data/Pricing.xlsx");
  });
});
