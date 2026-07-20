# Pricing Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Next.js static-export dashboard that renders the Stories pricing benchmark — Executive Summary, Category Positioning, Findings & Recommendations (with a presenter-mode toggle), and a Full Data Explorer — branded to the Ru'ya 360 identity, deployable to GitHub Pages now and Vercel later with no rework.

**Architecture:** A Next.js App Router project (`web/`) with `output: 'export'`. A server-side data-loading module reads the committed `processed/*.json` analytics files at build time (no client-side fetch, no backend). Pure TypeScript functions do all data shaping (KPIs, category positioning rows, outlier groupings, search/sort) and are unit-tested with Vitest; the React components that render them get focused smoke/interaction tests with React Testing Library.

**Tech Stack:** Next.js (App Router, TypeScript, static export), Tailwind CSS v4, Recharts (charting), Vitest + React Testing Library + jsdom (testing), npm.

**Reference spec:** `docs/superpowers/specs/2026-07-20-stories-pricing-dashboard-design.md` — this plan implements spec §5-8 (dashboard UI, branding, deployment).

**Depends on:** `docs/superpowers/plans/2026-07-20-pricing-data-pipeline.md` must be executed first. This plan's Task 2 test asserts against the real committed `processed/stories-pricing-2026-03.json` (583 products, 25 categories — the raw sheet has 591 product lines across 25 categories, but 7 lines have no price from any brand and 1 product name is duplicated with conflicting prices across two rows, so the deduplicated analytics output is 583 products; see `data_quality_warnings` in the output for the duplicate) — it will fail if that file doesn't exist yet.

## Global Constraints

- Currency: every price display uses `formatDualCurrency` — LBP as the primary figure, USD as a parenthetical secondary equivalent. Never USD-first.
- Brand colors (from `Branding/Colour Palette/Color Palette.pdf`): Ocean `#2f5b6b` (Stories, always), Lime Dust `#e7e569` (sparing UI accent), Sky Aqua `#66c4dd`, Deep Turquoise `#2b96af`, Burnt Coral `#ea5c3f`, Sunset Gold `#f7b759` (the 4 competitor colors, one each, consistent everywhere).
- Semantic colors for outlier direction (overpriced/underpriced) are deliberately **outside** the brand's 6-hue set — red `#dc2626` and violet `#7c3aed` — so "whose price is this" (brand color) and "is this over/under market" (semantic color) never visually collide. Always paired with an icon/label, never color alone.
- Fonts: Clash Display Variable (`Branding/Fonts/clash font.zip`) for headlines/KPI numbers, Montserrat (Google Fonts) for body/table text.
- This dashboard's competitor-color mapping (`COMPETITOR_COLORS` keyed by the 4 real competitor names) is intentionally Stories-specific — unlike the Plan 1 pipeline, which stays fully generic. A future client's dashboard gets its own build.
- Package manager: npm. Project root for the web app: `web/`.

---

### Task 1: Next.js + Tailwind Scaffold, Brand Fonts, Theme Tokens

**Files:**
- Create: `web/` (via `create-next-app`)
- Create: `web/app/fonts.ts`
- Create: `web/app/fonts/ClashDisplay-Variable.ttf`
- Modify: `web/app/globals.css`
- Modify: `web/app/layout.tsx`
- Modify: `web/next.config.ts`
- Create: `web/vitest.config.ts`
- Create: `web/vitest.setup.ts`
- Create: `web/lib/theme/colors.ts`
- Test: `web/lib/theme/colors.test.ts`

**Interfaces:**
- Produces: `web/lib/theme/colors.ts` exporting `BRAND_COLORS`, `COMPETITOR_COLORS: Record<string, string>`, `SEMANTIC_COLORS` — the canonical JS-side color source for Recharts (which can't read CSS custom properties). Every later task that needs a hex value imports from here.

- [ ] **Step 1: Scaffold the Next.js app**

From the repo root:
```bash
npx create-next-app@latest web --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint --use-npm
```

- [ ] **Step 2: Add testing dependencies**

```bash
cd web
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install recharts
```

- [ ] **Step 3: Configure Vitest**

Create `web/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Create `web/vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add to `web/package.json` `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 4: Configure static export**

Modify `web/next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 5: Extract and copy the Clash Display font**

From the repo root:
```bash
cd Branding/Fonts
unzip -o "clash font.zip" -d clash-display
cd ../..
mkdir -p web/app/fonts
cp "Branding/Fonts/clash-display/clash font/ClashDisplay-Variable.ttf" web/app/fonts/ClashDisplay-Variable.ttf
```

- [ ] **Step 6: Write the failing test for theme colors**

Create `web/lib/theme/colors.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { BRAND_COLORS, COMPETITOR_COLORS, SEMANTIC_COLORS } from "./colors";

describe("theme colors", () => {
  it("assigns Stories to Ocean", () => {
    expect(BRAND_COLORS.stories).toBe("#2f5b6b");
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
});
```

- [ ] **Step 7: Run test, verify it fails**

Run: `npm run test -- colors.test.ts`
Expected: FAIL — cannot find module `./colors`

- [ ] **Step 8: Implement colors.ts**

Create `web/lib/theme/colors.ts`:
```ts
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
```

- [ ] **Step 9: Run test, verify it passes**

Run: `npm run test -- colors.test.ts`
Expected: PASS (3 passed)

- [ ] **Step 10: Wire fonts and theme into the app shell**

Create `web/app/fonts.ts`:
```ts
import localFont from "next/font/local";
import { Montserrat } from "next/font/google";

export const clashDisplay = localFont({
  src: "./fonts/ClashDisplay-Variable.ttf",
  variable: "--font-clash-display",
  weight: "200 700",
  display: "swap",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});
```

Replace the contents of `web/app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-ocean: #2f5b6b;
  --color-lime-dust: #e7e569;
  --color-sky-aqua: #66c4dd;
  --color-deep-turquoise: #2b96af;
  --color-burnt-coral: #ea5c3f;
  --color-sunset-gold: #f7b759;

  --font-display: var(--font-clash-display), sans-serif;
  --font-body: var(--font-montserrat), sans-serif;
}

body {
  @apply bg-white text-ocean;
  font-family: var(--font-body);
}
```

Modify `web/app/layout.tsx` to apply the font variables (replace the default font imports/usage with):
```tsx
import type { Metadata } from "next";
import { clashDisplay, montserrat } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stories Pricing Benchmark — Ru'ya 360",
  description: "Pricing positioning analysis prepared for Stories by Ru'ya 360.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${clashDisplay.variable} ${montserrat.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 11: Commit**

```bash
cd ..
git add web/ Branding/Fonts/clash-display
git commit -m "feat: scaffold Next.js dashboard, brand fonts/theme, Vitest setup"
```

---

### Task 2: Report Data Types and Loader

**Files:**
- Create: `web/lib/data/types.ts`
- Create: `web/lib/data/loadReport.ts`
- Test: `web/lib/data/loadReport.test.ts`

**Interfaces:**
- Produces: types `ProductAnalytics`, `CategoryRollup`, `ReportMeta`, `PricingReport` (mirroring the exact shape written by Plan 1's `run_analysis`); functions `listReportSlugs(): string[]` and `loadReport(slug: string): PricingReport`, reading from `../processed/` relative to the `web/` working directory (i.e. the repo-root `processed/` folder).

- [ ] **Step 1: Write the failing test**

Create `web/lib/data/loadReport.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -- loadReport.test.ts`
Expected: FAIL — cannot find module `./loadReport`

- [ ] **Step 3: Implement types.ts and loadReport.ts**

Create `web/lib/data/types.ts`:
```ts
export interface ProductAnalytics {
  category: string;
  product: string;
  prices_lbp: Record<string, number>;
  own_price_lbp: number | null;
  competitor_avg_lbp: number | null;
  price_index: number | null;
  comparability: "high" | "medium" | "low";
  tier: "Value" | "Core" | "Premium" | null;
  is_outlier: boolean;
  outlier_direction: "overpriced" | "underpriced" | null;
}

export interface CategoryRollup {
  category: string;
  product_count: number;
  countable_product_count: number;
  avg_price_index: number | null;
}

export interface ReportMeta {
  client: string;
  report_date: string;
  currency: string;
  fx_usd_rate: number;
  fx_rate_date: string;
  fx_source: string;
  own_brand: string;
  competitors: string[];
  generated_from?: string;
}

export interface PricingReport {
  meta: ReportMeta;
  products: ProductAnalytics[];
  categories: CategoryRollup[];
}
```

Create `web/lib/data/loadReport.ts`:
```ts
import fs from "node:fs";
import path from "node:path";
import type { PricingReport } from "./types";

const PROCESSED_DIR = path.join(process.cwd(), "..", "processed");

export function listReportSlugs(): string[] {
  return fs
    .readdirSync(PROCESSED_DIR)
    .filter((name) => name.endsWith(".json") && !name.endsWith(".normalized.json"))
    .map((name) => name.replace(/\.json$/, ""));
}

export function loadReport(slug: string): PricingReport {
  const filePath = path.join(PROCESSED_DIR, `${slug}.json`);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as PricingReport;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -- loadReport.test.ts`
Expected: PASS (2 passed). If it fails with "no such file or directory" for `processed/stories-pricing-2026-03.json`, Plan 1 has not been run yet — go run it first.

- [ ] **Step 5: Commit**

```bash
git add web/lib/data/
git commit -m "feat: add report types and build-time JSON loader"
```

---

### Task 3: Currency Formatting

**Files:**
- Create: `web/lib/format/currency.ts`
- Test: `web/lib/format/currency.test.ts`

**Interfaces:**
- Produces: `formatLbp(value: number): string`, `formatUsd(value: number): string`, `formatDualCurrency(lbp: number, fxRate: number): string` — used by every component that displays a price.

- [ ] **Step 1: Write the failing test**

Create `web/lib/format/currency.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -- currency.test.ts`
Expected: FAIL — cannot find module `./currency`

- [ ] **Step 3: Implement currency.ts**

Create `web/lib/format/currency.ts`:
```ts
export function formatLbp(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} LBP`;
}

export function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDualCurrency(lbp: number, fxRate: number): string {
  const usd = lbp / fxRate;
  return `${formatLbp(lbp)} (${formatUsd(usd)})`;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -- currency.test.ts`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add web/lib/format/
git commit -m "feat: add LBP-primary/USD-secondary currency formatting"
```

---

### Task 4: Executive Summary KPIs

**Files:**
- Create: `web/lib/analytics/summary.ts`
- Test: `web/lib/analytics/summary.test.ts`
- Create: `web/components/ExecutiveSummary.tsx`
- Test: `web/components/ExecutiveSummary.test.tsx`

**Interfaces:**
- Consumes: `PricingReport`, `CategoryRollup` (Task 2).
- Produces: `computeSummaryKpis(report: PricingReport): SummaryKpis` where `SummaryKpis = { overallAvgIndex: number | null; categoriesAboveMarket: number; categoriesBelowMarket: number; coveragePct: number; topOverIndexed: CategoryRollup[]; topUnderIndexed: CategoryRollup[] }`. Component `<ExecutiveSummary kpis={SummaryKpis} />`.

- [ ] **Step 1: Write the failing test for computeSummaryKpis**

Create `web/lib/analytics/summary.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { computeSummaryKpis } from "./summary";
import type { PricingReport } from "../data/types";

function buildReport(): PricingReport {
  return {
    meta: {
      client: "Stories",
      report_date: "2026-03-01",
      currency: "LBP",
      fx_usd_rate: 89600,
      fx_rate_date: "2026-07-20",
      fx_source: "test",
      own_brand: "Stories",
      competitors: ["Espresso Lab"],
    },
    products: [{}, {}, {}] as PricingReport["products"],
    categories: [
      { category: "Hot", product_count: 2, countable_product_count: 2, avg_price_index: 120 },
      { category: "Cold", product_count: 1, countable_product_count: 1, avg_price_index: 80 },
    ],
  };
}

describe("computeSummaryKpis", () => {
  it("computes overall average index and above/below counts", () => {
    const kpis = computeSummaryKpis(buildReport());
    expect(kpis.overallAvgIndex).toBe(100);
    expect(kpis.categoriesAboveMarket).toBe(1);
    expect(kpis.categoriesBelowMarket).toBe(1);
  });

  it("computes coverage percentage from countable products vs total products", () => {
    const kpis = computeSummaryKpis(buildReport());
    expect(kpis.coveragePct).toBe(100);
  });

  it("ranks top over- and under-indexed categories", () => {
    const kpis = computeSummaryKpis(buildReport());
    expect(kpis.topOverIndexed[0].category).toBe("Hot");
    expect(kpis.topUnderIndexed[0].category).toBe("Cold");
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -- summary.test.ts`
Expected: FAIL — cannot find module `./summary`

- [ ] **Step 3: Implement summary.ts**

Create `web/lib/analytics/summary.ts`:
```ts
import type { CategoryRollup, PricingReport } from "../data/types";

export interface SummaryKpis {
  overallAvgIndex: number | null;
  categoriesAboveMarket: number;
  categoriesBelowMarket: number;
  coveragePct: number;
  topOverIndexed: CategoryRollup[];
  topUnderIndexed: CategoryRollup[];
}

export function computeSummaryKpis(report: PricingReport): SummaryKpis {
  const withIndex = report.categories.filter(
    (c): c is CategoryRollup & { avg_price_index: number } => c.avg_price_index !== null
  );

  const overallAvgIndex = withIndex.length
    ? Math.round((withIndex.reduce((sum, c) => sum + c.avg_price_index, 0) / withIndex.length) * 10) / 10
    : null;

  const categoriesAboveMarket = withIndex.filter((c) => c.avg_price_index > 100).length;
  const categoriesBelowMarket = withIndex.filter((c) => c.avg_price_index < 100).length;

  const totalCountable = report.categories.reduce((sum, c) => sum + c.countable_product_count, 0);
  const coveragePct = report.products.length
    ? Math.round((totalCountable / report.products.length) * 1000) / 10
    : 0;

  const sortedDescending = [...withIndex].sort((a, b) => b.avg_price_index - a.avg_price_index);
  const sortedAscending = [...withIndex].sort((a, b) => a.avg_price_index - b.avg_price_index);

  return {
    overallAvgIndex,
    categoriesAboveMarket,
    categoriesBelowMarket,
    coveragePct,
    topOverIndexed: sortedDescending.slice(0, 3),
    topUnderIndexed: sortedAscending.slice(0, 3),
  };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -- summary.test.ts`
Expected: PASS (3 passed)

- [ ] **Step 5: Write the failing component test**

Create `web/components/ExecutiveSummary.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ExecutiveSummary } from "./ExecutiveSummary";

describe("ExecutiveSummary", () => {
  it("renders the four KPI tiles", () => {
    render(
      <ExecutiveSummary
        kpis={{
          overallAvgIndex: 97.5,
          categoriesAboveMarket: 5,
          categoriesBelowMarket: 8,
          coveragePct: 62.3,
          topOverIndexed: [],
          topUnderIndexed: [],
        }}
      />
    );

    expect(screen.getByText("97.5")).toBeInTheDocument();
    expect(screen.getByText("Categories Above Market")).toBeInTheDocument();
    expect(screen.getByText("62.3%")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test, verify it fails**

Run: `npm run test -- ExecutiveSummary.test.tsx`
Expected: FAIL — cannot find module `./ExecutiveSummary`

- [ ] **Step 7: Implement ExecutiveSummary.tsx**

Create `web/components/ExecutiveSummary.tsx`:
```tsx
import type { SummaryKpis } from "@/lib/analytics/summary";

export function ExecutiveSummary({ kpis }: { kpis: SummaryKpis }) {
  return (
    <section aria-label="Executive Summary" className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <KpiTile
        label="Overall Price Index"
        value={kpis.overallAvgIndex !== null ? `${kpis.overallAvgIndex}` : "—"}
      />
      <KpiTile label="Categories Above Market" value={String(kpis.categoriesAboveMarket)} />
      <KpiTile label="Categories Below Market" value={String(kpis.categoriesBelowMarket)} />
      <KpiTile label="Data Coverage" value={`${kpis.coveragePct}%`} />
    </section>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ocean/10 bg-white p-4 shadow-sm">
      <p className="text-sm text-ocean/70">{label}</p>
      <p className="font-display text-3xl text-ocean">{value}</p>
    </div>
  );
}
```

- [ ] **Step 8: Run test, verify it passes**

Run: `npm run test -- ExecutiveSummary.test.tsx`
Expected: PASS (1 passed)

- [ ] **Step 9: Commit**

```bash
git add web/lib/analytics/summary.ts web/lib/analytics/summary.test.ts web/components/ExecutiveSummary.tsx web/components/ExecutiveSummary.test.tsx
git commit -m "feat: add executive summary KPI calculations and component"
```

---

### Task 5: Category Positioning View

**Files:**
- Create: `web/lib/analytics/categoryPositioning.ts`
- Test: `web/lib/analytics/categoryPositioning.test.ts`
- Create: `web/components/CategoryPositioning.tsx`
- Test: `web/components/CategoryPositioning.test.tsx`

**Interfaces:**
- Consumes: `CategoryRollup` (Task 2), `SEMANTIC_COLORS` (Task 1).
- Produces: `prepareCategoryPositioning(categories: CategoryRollup[]): CategoryPositioningRow[]` where `CategoryPositioningRow = { category: string; avgIndex: number; deviation: number; direction: "above" | "below" | "at-par" }`, sorted by deviation descending. Component `<CategoryPositioning rows={CategoryPositioningRow[]} />`.

- [ ] **Step 1: Write the failing test for prepareCategoryPositioning**

Create `web/lib/analytics/categoryPositioning.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { prepareCategoryPositioning } from "./categoryPositioning";
import type { CategoryRollup } from "../data/types";

describe("prepareCategoryPositioning", () => {
  it("computes deviation from 100 and direction, excludes null-index categories, sorts descending", () => {
    const categories: CategoryRollup[] = [
      { category: "Hot", product_count: 5, countable_product_count: 5, avg_price_index: 120 },
      { category: "Cold", product_count: 3, countable_product_count: 3, avg_price_index: 85 },
      { category: "Empty", product_count: 1, countable_product_count: 0, avg_price_index: null },
      { category: "AtPar", product_count: 2, countable_product_count: 2, avg_price_index: 100 },
    ];

    const rows = prepareCategoryPositioning(categories);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ category: "Hot", avgIndex: 120, deviation: 20, direction: "above" });
    expect(rows.find((r) => r.category === "Cold")).toEqual({
      category: "Cold",
      avgIndex: 85,
      deviation: -15,
      direction: "below",
    });
    expect(rows.find((r) => r.category === "AtPar")?.direction).toBe("at-par");
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -- categoryPositioning.test.ts`
Expected: FAIL — cannot find module `./categoryPositioning`

- [ ] **Step 3: Implement categoryPositioning.ts**

Create `web/lib/analytics/categoryPositioning.ts`:
```ts
import type { CategoryRollup } from "../data/types";

export interface CategoryPositioningRow {
  category: string;
  avgIndex: number;
  deviation: number;
  direction: "above" | "below" | "at-par";
}

export function prepareCategoryPositioning(categories: CategoryRollup[]): CategoryPositioningRow[] {
  return categories
    .filter((c): c is CategoryRollup & { avg_price_index: number } => c.avg_price_index !== null)
    .map((c) => {
      const deviation = Math.round((c.avg_price_index - 100) * 10) / 10;
      const direction: CategoryPositioningRow["direction"] =
        deviation > 0.5 ? "above" : deviation < -0.5 ? "below" : "at-par";
      return { category: c.category, avgIndex: c.avg_price_index, deviation, direction };
    })
    .sort((a, b) => b.deviation - a.deviation);
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -- categoryPositioning.test.ts`
Expected: PASS (1 passed)

- [ ] **Step 5: Write the failing component smoke test**

Create `web/components/CategoryPositioning.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoryPositioning } from "./CategoryPositioning";

describe("CategoryPositioning", () => {
  it("renders without crashing for a set of category rows", () => {
    render(
      <CategoryPositioning
        rows={[
          { category: "Hot", avgIndex: 120, deviation: 20, direction: "above" },
          { category: "Cold", avgIndex: 85, deviation: -15, direction: "below" },
        ]}
      />
    );

    expect(screen.getByTestId("category-positioning")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test, verify it fails**

Run: `npm run test -- CategoryPositioning.test.tsx`
Expected: FAIL — cannot find module `./CategoryPositioning`

- [ ] **Step 7: Implement CategoryPositioning.tsx**

Create `web/components/CategoryPositioning.tsx`:
```tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryPositioningRow } from "@/lib/analytics/categoryPositioning";
import { SEMANTIC_COLORS } from "@/lib/theme/colors";

export function CategoryPositioning({ rows }: { rows: CategoryPositioningRow[] }) {
  return (
    <div className="h-[600px] w-full" aria-label="Category Positioning" data-testid="category-positioning">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 120, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}`} />
          <YAxis type="category" dataKey="category" width={160} />
          <ReferenceLine x={0} stroke="#2f5b6b" />
          <Tooltip formatter={(value: number) => [`${value > 0 ? "+" : ""}${value} pts`, "vs. market"]} />
          <Bar dataKey="deviation">
            {rows.map((row) => (
              <Cell
                key={row.category}
                fill={
                  row.direction === "above"
                    ? SEMANTIC_COLORS.overpriced
                    : row.direction === "below"
                    ? SEMANTIC_COLORS.underpriced
                    : "#94a3b8"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 8: Run test, verify it passes**

Run: `npm run test -- CategoryPositioning.test.tsx`
Expected: PASS (1 passed). (This test only checks the component mounts without throwing — Recharts' `ResponsiveContainer` needs real layout dimensions that jsdom doesn't provide, so deep chart-internals assertions are not reliable in this environment. Visual correctness is checked in Task 8's browser verification step.)

- [ ] **Step 9: Commit**

```bash
git add web/lib/analytics/categoryPositioning.ts web/lib/analytics/categoryPositioning.test.ts web/components/CategoryPositioning.tsx web/components/CategoryPositioning.test.tsx
git commit -m "feat: add category positioning data prep and diverging bar chart"
```

---

### Task 6: Findings & Recommendations + Presenter Mode

**Files:**
- Create: `web/lib/analytics/findings.ts`
- Test: `web/lib/analytics/findings.test.ts`
- Create: `web/lib/presenter/PresenterModeContext.tsx`
- Create: `web/components/PresenterModeToggle.tsx`
- Create: `web/components/FindingsRecommendations.tsx`
- Test: `web/components/PresenterMode.test.tsx`

**Interfaces:**
- Consumes: `ProductAnalytics` (Task 2), `formatDualCurrency` (Task 3).
- Produces: `groupOutlierFindings(products: ProductAnalytics[]): FindingsGroups` where `FindingsGroups = { overpriced: ProductAnalytics[]; underpriced: ProductAnalytics[] }`; `PresenterModeProvider`, `usePresenterMode()` returning `{ showRecommendations: boolean; toggle: () => void }`; components `<PresenterModeToggle />` and `<FindingsRecommendations findings={FindingsGroups} fxRate={number} />`.

- [ ] **Step 1: Write the failing test for groupOutlierFindings**

Create `web/lib/analytics/findings.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { groupOutlierFindings } from "./findings";
import type { ProductAnalytics } from "../data/types";

function product(overrides: Partial<ProductAnalytics>): ProductAnalytics {
  return {
    category: "Hot",
    product: "Item",
    prices_lbp: {},
    own_price_lbp: 100000,
    competitor_avg_lbp: 100000,
    price_index: 100,
    comparability: "high",
    tier: "Core",
    is_outlier: false,
    outlier_direction: null,
    ...overrides,
  };
}

describe("groupOutlierFindings", () => {
  it("splits outliers into overpriced (desc) and underpriced (asc), ignoring non-outliers", () => {
    const products = [
      product({ product: "A", price_index: 130, is_outlier: true, outlier_direction: "overpriced" }),
      product({ product: "B", price_index: 118, is_outlier: true, outlier_direction: "overpriced" }),
      product({ product: "C", price_index: 70, is_outlier: true, outlier_direction: "underpriced" }),
      product({ product: "D", price_index: 105, is_outlier: false, outlier_direction: null }),
    ];

    const { overpriced, underpriced } = groupOutlierFindings(products);

    expect(overpriced.map((p) => p.product)).toEqual(["A", "B"]);
    expect(underpriced.map((p) => p.product)).toEqual(["C"]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -- findings.test.ts`
Expected: FAIL — cannot find module `./findings`

- [ ] **Step 3: Implement findings.ts**

Create `web/lib/analytics/findings.ts`:
```ts
import type { ProductAnalytics } from "../data/types";

export interface FindingsGroups {
  overpriced: ProductAnalytics[];
  underpriced: ProductAnalytics[];
}

export function groupOutlierFindings(products: ProductAnalytics[]): FindingsGroups {
  return {
    overpriced: products
      .filter((p) => p.is_outlier && p.outlier_direction === "overpriced")
      .sort((a, b) => (b.price_index ?? 0) - (a.price_index ?? 0)),
    underpriced: products
      .filter((p) => p.is_outlier && p.outlier_direction === "underpriced")
      .sort((a, b) => (a.price_index ?? 0) - (b.price_index ?? 0)),
  };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -- findings.test.ts`
Expected: PASS (1 passed)

- [ ] **Step 5: Write the failing presenter-mode interaction test**

Create `web/components/PresenterMode.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { PresenterModeProvider } from "@/lib/presenter/PresenterModeContext";
import { PresenterModeToggle } from "./PresenterModeToggle";
import { FindingsRecommendations } from "./FindingsRecommendations";
import type { FindingsGroups } from "@/lib/analytics/findings";

const findings: FindingsGroups = {
  overpriced: [
    {
      category: "Hot",
      product: "Latte",
      prices_lbp: {},
      own_price_lbp: 400000,
      competitor_avg_lbp: 300000,
      price_index: 133,
      comparability: "high",
      tier: "Premium",
      is_outlier: true,
      outlier_direction: "overpriced",
    },
  ],
  underpriced: [],
};

describe("Presenter mode", () => {
  it("hides and re-shows the Findings section on toggle", async () => {
    const user = userEvent.setup();
    render(
      <PresenterModeProvider>
        <PresenterModeToggle />
        <FindingsRecommendations findings={findings} fxRate={89600} />
      </PresenterModeProvider>
    );

    expect(screen.getByText("Repricing Candidates (Overpriced)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide Recommendations" }));
    expect(screen.queryByText("Repricing Candidates (Overpriced)")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Recommendations" }));
    expect(screen.getByText("Repricing Candidates (Overpriced)")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test, verify it fails**

Run: `npm run test -- PresenterMode.test.tsx`
Expected: FAIL — cannot find modules `@/lib/presenter/PresenterModeContext`, `./PresenterModeToggle`, `./FindingsRecommendations`

- [ ] **Step 7: Implement PresenterModeContext, PresenterModeToggle, FindingsRecommendations**

Create `web/lib/presenter/PresenterModeContext.tsx`:
```tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PresenterModeContextValue {
  showRecommendations: boolean;
  toggle: () => void;
}

const PresenterModeContext = createContext<PresenterModeContextValue | null>(null);

export function PresenterModeProvider({ children }: { children: ReactNode }) {
  const [showRecommendations, setShowRecommendations] = useState(true);
  return (
    <PresenterModeContext.Provider
      value={{ showRecommendations, toggle: () => setShowRecommendations((v) => !v) }}
    >
      {children}
    </PresenterModeContext.Provider>
  );
}

export function usePresenterMode(): PresenterModeContextValue {
  const ctx = useContext(PresenterModeContext);
  if (!ctx) throw new Error("usePresenterMode must be used within a PresenterModeProvider");
  return ctx;
}
```

Create `web/components/PresenterModeToggle.tsx`:
```tsx
"use client";

import { usePresenterMode } from "@/lib/presenter/PresenterModeContext";

export function PresenterModeToggle() {
  const { showRecommendations, toggle } = usePresenterMode();
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-ocean/20 px-4 py-1.5 text-sm text-ocean"
    >
      {showRecommendations ? "Hide Recommendations" : "Show Recommendations"}
    </button>
  );
}
```

Create `web/components/FindingsRecommendations.tsx`:
```tsx
"use client";

import { usePresenterMode } from "@/lib/presenter/PresenterModeContext";
import type { FindingsGroups } from "@/lib/analytics/findings";
import { formatDualCurrency } from "@/lib/format/currency";

export function FindingsRecommendations({
  findings,
  fxRate,
}: {
  findings: FindingsGroups;
  fxRate: number;
}) {
  const { showRecommendations } = usePresenterMode();
  if (!showRecommendations) return null;

  return (
    <section aria-label="Findings and Recommendations" className="space-y-6">
      <FindingsList
        title="Repricing Candidates (Overpriced)"
        items={findings.overpriced}
        fxRate={fxRate}
        accentClassName="text-red-600"
      />
      <FindingsList
        title="Trade-Up Opportunities (Underpriced)"
        items={findings.underpriced}
        fxRate={fxRate}
        accentClassName="text-violet-600"
      />
    </section>
  );
}

function FindingsList({
  title,
  items,
  fxRate,
  accentClassName,
}: {
  title: string;
  items: FindingsGroups["overpriced"];
  fxRate: number;
  accentClassName: string;
}) {
  return (
    <div>
      <h3 className={`font-display text-lg ${accentClassName}`}>{title}</h3>
      <ul className="mt-2 divide-y divide-ocean/10">
        {items.map((item) => (
          <li
            key={`${item.category}-${item.product}`}
            className="flex items-center justify-between py-2 text-sm"
          >
            <span>
              {item.product} <span className="text-ocean/50">({item.category})</span>
            </span>
            <span>
              {item.own_price_lbp !== null ? formatDualCurrency(item.own_price_lbp, fxRate) : "—"} · index{" "}
              {item.price_index}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 8: Run test, verify it passes**

Run: `npm run test -- PresenterMode.test.tsx`
Expected: PASS (1 passed)

- [ ] **Step 9: Commit**

```bash
git add web/lib/analytics/findings.ts web/lib/analytics/findings.test.ts web/lib/presenter/ web/components/PresenterModeToggle.tsx web/components/FindingsRecommendations.tsx web/components/PresenterMode.test.tsx
git commit -m "feat: add findings/recommendations grouping and presenter-mode toggle"
```

---

### Task 7: Full Data Explorer

**Files:**
- Create: `web/lib/analytics/explorer.ts`
- Test: `web/lib/analytics/explorer.test.ts`
- Create: `web/components/DataExplorer.tsx`
- Test: `web/components/DataExplorer.test.tsx`

**Interfaces:**
- Consumes: `ProductAnalytics` (Task 2), `formatDualCurrency` (Task 3).
- Produces: `searchProducts(products: ProductAnalytics[], query: string): ProductAnalytics[]` (matches product or category name, case-insensitive). Component `<DataExplorer products={ProductAnalytics[]} fxRate={number} />` with a live search input.

- [ ] **Step 1: Write the failing test for searchProducts**

Create `web/lib/analytics/explorer.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { searchProducts } from "./explorer";
import type { ProductAnalytics } from "../data/types";

function product(category: string, name: string): ProductAnalytics {
  return {
    category,
    product: name,
    prices_lbp: {},
    own_price_lbp: 100000,
    competitor_avg_lbp: 100000,
    price_index: 100,
    comparability: "high",
    tier: "Core",
    is_outlier: false,
    outlier_direction: null,
  };
}

describe("searchProducts", () => {
  const products = [product("Black Coffee", "Americano MEDIUM"), product("Pastries", "Croissant")];

  it("returns all products for an empty query", () => {
    expect(searchProducts(products, "")).toHaveLength(2);
  });

  it("matches by product name, case-insensitive", () => {
    expect(searchProducts(products, "americano")).toEqual([products[0]]);
  });

  it("matches by category name", () => {
    expect(searchProducts(products, "pastries")).toEqual([products[1]]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -- explorer.test.ts`
Expected: FAIL — cannot find module `./explorer`

- [ ] **Step 3: Implement explorer.ts**

Create `web/lib/analytics/explorer.ts`:
```ts
import type { ProductAnalytics } from "../data/types";

export function searchProducts(products: ProductAnalytics[], query: string): ProductAnalytics[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) => p.product.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -- explorer.test.ts`
Expected: PASS (3 passed)

- [ ] **Step 5: Write the failing component interaction test**

Create `web/components/DataExplorer.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { DataExplorer } from "./DataExplorer";
import type { ProductAnalytics } from "@/lib/data/types";

function product(category: string, name: string): ProductAnalytics {
  return {
    category,
    product: name,
    prices_lbp: {},
    own_price_lbp: 300000,
    competitor_avg_lbp: 300000,
    price_index: 100,
    comparability: "high",
    tier: "Core",
    is_outlier: false,
    outlier_direction: null,
  };
}

describe("DataExplorer", () => {
  it("filters the visible rows as the user types in the search box", async () => {
    const user = userEvent.setup();
    render(
      <DataExplorer
        products={[product("Black Coffee", "Americano MEDIUM"), product("Pastries", "Croissant")]}
        fxRate={89600}
      />
    );

    expect(screen.getByText("Croissant")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search product or category…"), "americano");

    expect(screen.getByText("Americano MEDIUM")).toBeInTheDocument();
    expect(screen.queryByText("Croissant")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test, verify it fails**

Run: `npm run test -- DataExplorer.test.tsx`
Expected: FAIL — cannot find module `./DataExplorer`

- [ ] **Step 7: Implement DataExplorer.tsx**

Create `web/components/DataExplorer.tsx`:
```tsx
"use client";

import { useMemo, useState } from "react";
import type { ProductAnalytics } from "@/lib/data/types";
import { searchProducts } from "@/lib/analytics/explorer";
import { formatDualCurrency } from "@/lib/format/currency";

export function DataExplorer({ products, fxRate }: { products: ProductAnalytics[]; fxRate: number }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => searchProducts(products, query), [products, query]);

  return (
    <section aria-label="Full Data Explorer">
      <input
        type="search"
        placeholder="Search product or category…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3 w-full rounded-md border border-ocean/20 px-3 py-2 text-sm"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ocean/60">
              <th className="py-2">Category</th>
              <th className="py-2">Product</th>
              <th className="py-2">Stories Price</th>
              <th className="py-2">Index</th>
              <th className="py-2">Comparability</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={`${p.category}-${p.product}`} className="border-t border-ocean/10">
                <td className="py-2">{p.category}</td>
                <td className="py-2">{p.product}</td>
                <td className="py-2">
                  {p.own_price_lbp !== null ? formatDualCurrency(p.own_price_lbp, fxRate) : "—"}
                </td>
                <td className="py-2">{p.price_index ?? "—"}</td>
                <td className="py-2">{p.comparability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Run test, verify it passes**

Run: `npm run test -- DataExplorer.test.tsx`
Expected: PASS (1 passed)

- [ ] **Step 9: Commit**

```bash
git add web/lib/analytics/explorer.ts web/lib/analytics/explorer.test.ts web/components/DataExplorer.tsx web/components/DataExplorer.test.tsx
git commit -m "feat: add searchable full data explorer table"
```

---

### Task 8: Context Bar and Page Wiring

**Files:**
- Create: `web/components/ContextBar.tsx`
- Test: `web/components/ContextBar.test.tsx`
- Modify: `web/app/page.tsx`

**Interfaces:**
- Consumes: `ReportMeta` (Task 2), `formatLbp` (Task 3), and every component/data-prep function from Tasks 4-7.
- Produces: `<ContextBar meta={ReportMeta} coveragePct={number} />`; `web/app/page.tsx` as a Server Component that loads the report and renders the full page.

- [ ] **Step 1: Write the failing test for ContextBar**

Create `web/components/ContextBar.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContextBar } from "./ContextBar";

describe("ContextBar", () => {
  it("shows client, period, FX rate with source, and a coverage caveat", () => {
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
        coveragePct={62.3}
      />
    );

    expect(screen.getByText(/Stories/)).toBeInTheDocument();
    expect(screen.getByText(/89,600 LBP\/USD/)).toBeInTheDocument();
    expect(screen.getByText(/lira-rate.com/)).toBeInTheDocument();
    expect(screen.getByText(/62.3% of line items/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -- ContextBar.test.tsx`
Expected: FAIL — cannot find module `./ContextBar`

- [ ] **Step 3: Implement ContextBar.tsx**

Create `web/components/ContextBar.tsx`:
```tsx
import type { ReportMeta } from "@/lib/data/types";

export function ContextBar({ meta, coveragePct }: { meta: ReportMeta; coveragePct: number }) {
  return (
    <div className="border-b border-ocean/10 bg-ocean/5 px-6 py-3 text-xs text-ocean/70">
      <p>
        Prepared for <strong className="text-ocean">{meta.client}</strong> — {meta.report_date} · Currency:{" "}
        {meta.currency}, USD shown as equivalent · FX: {meta.fx_usd_rate.toLocaleString("en-US")} LBP/USD as of{" "}
        {meta.fx_rate_date} (source: {meta.fx_source})
      </p>
      <p className="mt-1">
        Coverage note: {coveragePct}% of line items have enough competitor pricing (2+ competitors) for a reliable
        market comparison; lower-comparability items are shown in the Data Explorer but excluded from category
        averages.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -- ContextBar.test.tsx`
Expected: PASS (1 passed)

- [ ] **Step 5: Wire everything into the page**

Replace the contents of `web/app/page.tsx`:
```tsx
import { loadReport } from "@/lib/data/loadReport";
import { computeSummaryKpis } from "@/lib/analytics/summary";
import { prepareCategoryPositioning } from "@/lib/analytics/categoryPositioning";
import { groupOutlierFindings } from "@/lib/analytics/findings";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { CategoryPositioning } from "@/components/CategoryPositioning";
import { FindingsRecommendations } from "@/components/FindingsRecommendations";
import { PresenterModeToggle } from "@/components/PresenterModeToggle";
import { DataExplorer } from "@/components/DataExplorer";
import { ContextBar } from "@/components/ContextBar";
import { PresenterModeProvider } from "@/lib/presenter/PresenterModeContext";

export default function Home() {
  const report = loadReport("stories-pricing-2026-03");
  const kpis = computeSummaryKpis(report);
  const positioningRows = prepareCategoryPositioning(report.categories);
  const findings = groupOutlierFindings(report.products);

  return (
    <PresenterModeProvider>
      <ContextBar meta={report.meta} coveragePct={kpis.coveragePct} />
      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <header className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-ocean">Stories Pricing Benchmark</h1>
          <PresenterModeToggle />
        </header>
        <ExecutiveSummary kpis={kpis} />
        <CategoryPositioning rows={positioningRows} />
        <FindingsRecommendations findings={findings} fxRate={report.meta.fx_usd_rate} />
        <DataExplorer products={report.products} fxRate={report.meta.fx_usd_rate} />
      </main>
    </PresenterModeProvider>
  );
}
```

- [ ] **Step 6: Run the full test suite**

```bash
npm run test
```
Expected: all tests across every task pass.

- [ ] **Step 7: Verify the build and check it in a browser**

```bash
npm run build
npm run start
```
Open `http://localhost:3000` and confirm: the Context Bar shows Stories/period/FX rate, the four KPI tiles render real numbers, the Category Positioning chart renders bars for all 25 categories, the presenter-mode toggle hides/shows Findings & Recommendations, and the Data Explorer search filters the full product list. Stop the server (`Ctrl+C`) once confirmed.

- [ ] **Step 8: Commit**

```bash
git add web/components/ContextBar.tsx web/components/ContextBar.test.tsx web/app/page.tsx
git commit -m "feat: wire context bar and all views into the dashboard page"
```

---

### Task 9: GitHub Pages Deployment

**Files:**
- Modify: `web/next.config.ts`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: the pipeline CLIs from Plan 1 (`pricing_pipeline.parse_pricing`, `pricing_pipeline.analyze_pricing`), `npm run build` from Task 8.
- Produces: a GitHub Actions workflow that regenerates `processed/` from source, runs the full web test suite, builds the static export, and publishes it to GitHub Pages.

- [ ] **Step 1: Add basePath handling for the GitHub Pages subpath**

GitHub Pages serves a project repo (not a custom domain) under `/<repo-name>/`, so static asset URLs need a `basePath`. Replace `web/next.config.ts`:
```ts
import type { NextConfig } from "next";

// Set this to the actual GitHub repository name once it's created.
const REPO_NAME = "stories-pricing-dashboard";
const isGithubPagesBuild = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isGithubPagesBuild ? `/${REPO_NAME}` : "",
  assetPrefix: isGithubPagesBuild ? `/${REPO_NAME}/` : "",
};

export default nextConfig;
```

**Manual step (cannot be scripted):** once the GitHub repository is created, confirm `REPO_NAME` above matches it exactly (or switch to a custom domain and set both back to `""`, which removes the need for this entirely).

- [ ] **Step 2: Write the GitHub Actions workflow**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy dashboard to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install Python dependencies
        run: pip install -r requirements.txt

      - name: Regenerate processed data
        env:
          PYTHONPATH: scripts
        run: |
          python -m pricing_pipeline.parse_pricing \
            --xlsx "raw-data/Product Pricing Comparison March 2026 (1).xlsx" \
            --config sources/stories-pricing-2026-03.json \
            --out processed/stories-pricing-2026-03.normalized.json
          python -m pricing_pipeline.analyze_pricing \
            --in processed/stories-pricing-2026-03.normalized.json \
            --out processed/stories-pricing-2026-03.json

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: web/package-lock.json

      - name: Install web dependencies
        working-directory: web
        run: npm ci

      - name: Run web test suite
        working-directory: web
        run: npm run test

      - name: Build static export
        working-directory: web
        env:
          GITHUB_PAGES: "true"
        run: npm run build

      - uses: actions/configure-pages@v5

      - uses: actions/upload-pages-artifact@v3
        with:
          path: web/out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Verify the static export builds locally with the GitHub Pages env var set**

```bash
cd web
GITHUB_PAGES=true npm run build
```
Expected: build succeeds, `web/out/` contains the exported site, and asset URLs inside `web/out/index.html` are prefixed with `/stories-pricing-dashboard/` (confirms `basePath` took effect).

- [ ] **Step 4: Commit**

```bash
cd ..
git add web/next.config.ts .github/workflows/deploy.yml
git commit -m "feat: add GitHub Pages deployment workflow with basePath handling"
```

- [ ] **Step 5: Push and enable Pages (manual, do this with the user present)**

```bash
git remote add origin <the actual GitHub repo URL, once created>
git push -u origin main
```
Then in the repo's Settings → Pages, set the source to "GitHub Actions". Do not run the `git remote add`/`git push` commands until the user has confirmed the target repository — this is the plan's one genuinely irreversible, externally-visible step.

---

## Definition of Done

- `npm run test` (from `web/`) passes with 0 failures across all data-prep and component tests.
- `npm run build` (from `web/`) produces a static export in `web/out/` with no errors.
- Manually verified in a browser per Task 8 Step 7: all four dashboard views render real Stories data, presenter mode toggles Findings & Recommendations, search filters the Data Explorer.
- `.github/workflows/deploy.yml` exists and builds/tests/deploys on push to `main` — actual push and Pages enablement is a manual, confirmed-with-user step (Task 9 Step 5), not automated by this plan.
