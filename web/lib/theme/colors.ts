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

// Emphasis pattern for brand-vs-market charts (per the dataviz skill: "one
// series is the point, rest are context" → emphasis, not full categorical).
// Stories always renders in BRAND_COLORS.stories; every competitor renders
// in this single neutral gray, distinguished by position and the tooltip's
// brand name, not by fighting for one of four separate accent hues.
export const CONTEXT_COLOR = "#94a3b8"; // slate-400
