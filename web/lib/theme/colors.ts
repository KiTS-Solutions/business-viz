export const BRAND_COLORS = {
  stories: "#2f5b6b", // Ocean
  accent: "#e7e569", // Lime Dust — sparing UI accent only
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

// Chart-series colors for multi-brand charts (scatter/positioning map).
// The literal brand secondary palette (COMPETITOR_COLORS above) fails
// accessibility validation as a categorical series set — two pairs read as
// near-identical even to normal color vision (validated with the dataviz
// skill's validate_palette.js). This derived set keeps two hues close to
// brand family (teal, coral) and extends two further (purple, olive) to
// achieve real visual separation. Order is fixed and CVD-validated — do not
// reorder or reuse hues elsewhere. Stories itself never appears here; it
// always renders as BRAND_COLORS.stories so it reads as "us" at a glance.
export const CHART_COLORS: Record<string, string> = {
  "Espresso Lab": "#0d8fae",
  "Dunkin Donuts": "#d94f2e",
  "Joe & the Juice": "#6a4fc9",
  Starbucks: "#5a7a0f",
};
