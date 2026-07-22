import { describe, it, expect } from "vitest";
import { BRAND_COLORS, COMPETITOR_COLORS, SEMANTIC_COLORS, CONTEXT_COLOR, CHART_COLORS } from "./colors";

describe("theme colors", () => {
  it("assigns Stories its brand green", () => {
    expect(BRAND_COLORS.stories).toBe("#1f4d3d");
  });

  it("assigns each of the four competitors a distinct brand accent color", () => {
    const names = ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"];
    const colors = names.map((n) => COMPETITOR_COLORS[n]);
    expect(new Set(colors).size).toBe(4);
    colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
  });

  it("keeps semantic colors outside the brand competitor palette", () => {
    const brandHues = Object.values(COMPETITOR_COLORS);
    expect(brandHues).not.toContain(SEMANTIC_COLORS.overpriced);
    expect(brandHues).not.toContain(SEMANTIC_COLORS.underpriced);
  });

  it("keeps the emphasis context color distinct from Stories' brand color", () => {
    expect(CONTEXT_COLOR).not.toBe(BRAND_COLORS.stories);
    expect(CONTEXT_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("gives each of the four competitors a distinct, validated chart color, none matching Stories", () => {
    const names = ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"];
    const colors = names.map((n) => CHART_COLORS[n]);
    expect(new Set(colors).size).toBe(4);
    colors.forEach((c) => {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i);
      expect(c).not.toBe(BRAND_COLORS.stories);
    });
  });
});
