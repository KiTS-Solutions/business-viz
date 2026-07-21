import { describe, it, expect } from "vitest";
import { withBasePath } from "./basePath";

describe("withBasePath", () => {
  it("returns the path unchanged when GITHUB_PAGES is not set (local/dev)", () => {
    expect(withBasePath("/ruya-logo.jpg")).toBe("/ruya-logo.jpg");
  });
});
