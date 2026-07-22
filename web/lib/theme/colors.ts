import type { Theme } from "./ThemeContext";

export const BRAND_COLORS = {
  stories: "#1f4d3d", // Stories Green (rebrand from Ru'ya Ocean teal)
  accent: "#d9b382", // warm tan — Stories secondary accent, sparing UI use only
} as const;

// Dark-mode brand green — the light value (#1f4d3d) is a deep, low-chroma
// green that fails WCAG AA (1.85:1) against the dark page surfaces; this is
// the same OKLCH hue (167.8°) lightened+boosted to L=0.74/C=0.12, which
// clears 6.85:1 against --color-surface-2 (#1c2a23). accent is unchanged —
// already 9.09:1 against the dark page background, no dark variant needed.
export const DARK_BRAND_COLORS = {
  stories: "#4fc39c",
  accent: "#d9b382",
} as const;

export const COMPETITOR_COLORS: Record<string, string> = {
  "Espresso Lab": "#66c4dd", // Sky Aqua
  "Dunkin Donuts": "#2b96af", // Deep Turquoise
  "Joe & the Juice": "#ea5c3f", // Burnt Coral
  Starbucks: "#f7b759", // Sunset Gold
};

export const SEMANTIC_COLORS = {
  overpriced: "#dc2626", // red-600 — icon/text only, never a filled brand-style chip
  underpriced: "#7c3aed", // violet-600 — icon/text only, never a filled brand-style chip
} as const;

// Dark-mode semantic colors — red-600/violet-600 clear only ~3:1 against the
// dark surfaces (below the 4.5:1 text floor); Tailwind's red-400/violet-400
// clear 5.4:1 / 5.5:1 against --color-surface-2 (#1c2a23), same hue family.
export const DARK_SEMANTIC_COLORS = {
  overpriced: "#f87171",
  underpriced: "#a78bfa",
} as const;

// Neutral fallback for any brand not present in CHART_COLORS below.
export const CONTEXT_COLOR = "#94a3b8"; // slate-400
export const DARK_CONTEXT_COLOR = "#7c9187"; // clears 5.3:1 against the dark page background

// Chart-series colors for the 4 competitors, used where each competitor
// needs to be individually distinguishable (e.g. the Price Positioning Map).
// The literal brand secondary palette (COMPETITOR_COLORS above) fails
// accessibility validation as a categorical series set — validated with the
// dataviz skill's validate_palette.js: two pairs were indistinguishable even
// to normal color vision.
//
// IMPORTANT: none of these four may be a red or violet hue — SEMANTIC_COLORS
// above uses red = overpriced / violet = underpriced elsewhere on the same
// page (heatmap, Category Positioning), and an earlier version picked a red
// and a purple here, so "red" meant two contradictory things depending on
// which chart you were looking at. Validated in this exact order (matches
// the real on-page legend order — Espresso Lab, Dunkin Donuts, Joe & the
// Juice, Starbucks) — ALL CHECKS PASS; do not reorder or reuse these hues
// for anything else. Stories itself never appears here; it always renders
// as BRAND_COLORS.stories so it reads as "us" regardless of chart.
export const CHART_COLORS: Record<string, string> = {
  "Espresso Lab": "#0d8fae",
  "Dunkin Donuts": "#2b5aa8",
  "Joe & the Juice": "#c2477a",
  Starbucks: "#5a7a0f",
};

// Dark-mode chart series — the light set's OKLCH lightness (0.38–0.60) falls
// well below the dark-surface band (0.48–0.67); these are the same four
// hues re-stepped into that band and re-validated with validate_palette.js
// against surface #1c2a23 (Espresso Lab's and Dunkin's hues were also
// widened apart — 220.8°→200°, 260°→270° — to clear the normal-vision ΔE
// floor once lightened, which had collapsed their separation). ALL CHECKS
// PASS (one WARN: Dunkin's contrast sits at exactly 3:1 — legal per the
// skill's own rule since every use already pairs it with a text legend/
// label, never color alone). Do not reorder or reuse for anything else,
// same rule as the light set above.
export const DARK_CHART_COLORS: Record<string, string> = {
  "Espresso Lab": "#00969f",
  "Dunkin Donuts": "#526ac3",
  "Joe & the Juice": "#d05486",
  Starbucks: "#678723",
};

export function themedBrandColors(theme: Theme) {
  return theme === "dark" ? DARK_BRAND_COLORS : BRAND_COLORS;
}

export function themedSemanticColors(theme: Theme) {
  return theme === "dark" ? DARK_SEMANTIC_COLORS : SEMANTIC_COLORS;
}

export function themedChartColors(theme: Theme): Record<string, string> {
  return theme === "dark" ? DARK_CHART_COLORS : CHART_COLORS;
}

export function themedContextColor(theme: Theme): string {
  return theme === "dark" ? DARK_CONTEXT_COLOR : CONTEXT_COLOR;
}
