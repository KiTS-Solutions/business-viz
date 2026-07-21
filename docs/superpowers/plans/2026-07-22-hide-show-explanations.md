# Hide/Show Explanations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename and repurpose the existing presenter-mode toggle into a global "Show/Hide Explanations" control that defaults to hidden, and add a reusable per-paragraph "?" reveal so a viewer can open one explanation at a time without exposing everything else — applied across every explanatory paragraph on the dashboard.

**Architecture:** The existing `PresenterModeContext` (React context + `useState`, no persistence) is reused with its exposed field renamed `showRecommendations` → `showExplanations` and its default flipped `true` → `false`. `FindingsRecommendations` keeps its current all-or-nothing whole-section pattern, just reading the renamed field. A new `Explain` component wraps individual paragraphs: it renders its children when `showExplanations` is true OR the paragraph has been individually revealed, otherwise renders a small "?" button that reveals just that paragraph; the individual reveal resets whenever the global flag transitions to false. `Explain` is applied at each paragraph's usage site (`page.tsx`, `ReportSection.tsx`) — no changes to the paragraph content itself, and no changes to `Methodology.tsx`'s internals (its entire rendered output is wrapped as one block at its call site in `page.tsx`).

**Tech Stack:** Next.js 16 / React 19 / TypeScript, Vitest + Testing Library (existing stack, no new dependencies).

**Reference spec:** `docs/superpowers/specs/2026-07-22-hide-show-explanations-design.md`.

## Global Constraints

- `PresenterModeContext`, `PresenterModeProvider`, `usePresenterMode` names stay unchanged — only the exposed field is renamed (`showRecommendations` → `showExplanations`). No file renames.
- `showExplanations` default value is **`false`** (was `true`).
- Toggle button copy: exactly `"Show Explanations"` when hidden, exactly `"Hide Explanations"` when shown.
- `Explain`'s reveal button: `aria-label="Show explanation"`, renders the literal character `?` as its visible content.
- Findings & Recommendations keeps its existing all-or-nothing whole-section behavior (heading + content hide/show together) reading `showExplanations` directly — it does **not** use `Explain`.
- Methodology & Data Sources: `Methodology.tsx` itself is **not modified** — its entire usage site in `page.tsx` is wrapped in one `Explain`, so its heading (rendered by the surrounding `<Section>`) stays always visible while all of its body (all three internal sub-blocks) hides/reveals as one unit.
- Every new/changed component keeps the existing Ocean color tokens (`text-ocean`, `text-ocean-muted`, `border-ocean/20`, `font-display`) and Tailwind conventions already used throughout `web/components/`. No new colors, animations, or libraries.
- No persistence of toggle/reveal state across page reload — plain React state only, matching the existing pattern.

---

### Task 1: Rename & re-default the presenter-mode toggle, preserve Findings behavior

**Files:**
- Modify: `web/lib/presenter/PresenterModeContext.tsx`
- Modify: `web/components/PresenterModeToggle.tsx`
- Modify: `web/components/FindingsRecommendations.tsx`
- Modify: `web/components/PresenterMode.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `usePresenterMode(): { showExplanations: boolean; toggle: () => void }` — replaces the old `{ showRecommendations, toggle }` shape. `showExplanations` initializes to `false`.

- [ ] **Step 1: Write the failing test**

Replace the full contents of `web/components/PresenterMode.test.tsx`:

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
  it("hides the Findings section by default, and shows/hides it on toggle", async () => {
    const user = userEvent.setup();
    render(
      <PresenterModeProvider>
        <PresenterModeToggle />
        <FindingsRecommendations findings={findings} fxRate={89600} />
      </PresenterModeProvider>
    );

    // Explanations are hidden by default now (was shown by default before).
    expect(screen.queryByText(/Repricing Candidates/)).not.toBeInTheDocument();
    expect(screen.queryByText("Findings & Recommendations")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Explanations" }));
    expect(screen.getByText(/Repricing Candidates/)).toBeInTheDocument();
    expect(screen.getByText("Findings & Recommendations")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide Explanations" }));
    expect(screen.queryByText(/Repricing Candidates/)).not.toBeInTheDocument();
    // The heading itself must also disappear — it's rendered by
    // FindingsRecommendations itself (not an outer wrapper), specifically so
    // toggling off doesn't leave "Findings & Recommendations" floating over
    // nothing.
    expect(screen.queryByText("Findings & Recommendations")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npm run test -- PresenterMode.test.tsx`
Expected: FAIL — the button is currently labeled "Hide Recommendations" on first render (default `showRecommendations: true`), so `getByRole("button", { name: "Show Explanations" })` won't find it, and the Findings heading/content are present when the test expects them absent.

- [ ] **Step 3: Rename the context field and flip the default**

Replace the full contents of `web/lib/presenter/PresenterModeContext.tsx`:

```tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface PresenterModeContextValue {
  showExplanations: boolean;
  toggle: () => void;
}

const PresenterModeContext = createContext<PresenterModeContextValue | null>(null);

export function PresenterModeProvider({ children }: { children: ReactNode }) {
  const [showExplanations, setShowExplanations] = useState(false);
  return (
    <PresenterModeContext.Provider
      value={{ showExplanations, toggle: () => setShowExplanations((v) => !v) }}
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

- [ ] **Step 4: Rename the toggle button's field usage and copy**

Replace the full contents of `web/components/PresenterModeToggle.tsx`:

```tsx
"use client";

import { usePresenterMode } from "@/lib/presenter/PresenterModeContext";

export function PresenterModeToggle() {
  const { showExplanations, toggle } = usePresenterMode();
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-ocean/20 px-4 py-1.5 text-sm text-ocean"
    >
      {showExplanations ? "Hide Explanations" : "Show Explanations"}
    </button>
  );
}
```

- [ ] **Step 5: Rename the field usage in FindingsRecommendations**

In `web/components/FindingsRecommendations.tsx`, change:

```tsx
  const { showRecommendations } = usePresenterMode();
```

to:

```tsx
  const { showExplanations } = usePresenterMode();
```

and change:

```tsx
  if (!showRecommendations) return null;
```

to:

```tsx
  if (!showExplanations) return null;
```

No other line in this file changes — the rest of the component (the `FindingsList` sub-component, the recommendation copy, the comment above the early return) stays exactly as it is.

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd web && npm run test -- PresenterMode.test.tsx`
Expected: PASS.

- [ ] **Step 7: Run the full frontend test suite**

Run: `cd web && npm run test`
Expected: some OTHER test files will now fail because they still reference `showRecommendations` or the old button labels — this is expected at this point in the plan and fixed in later tasks (specifically `ReportSection.test.tsx`, which asserts on Findings & Recommendations text at default render). Confirm `PresenterMode.test.tsx` itself is green and note which other files fail, but do not fix them in this task.

- [ ] **Step 8: Commit**

```bash
git add web/lib/presenter/PresenterModeContext.tsx web/components/PresenterModeToggle.tsx web/components/FindingsRecommendations.tsx web/components/PresenterMode.test.tsx
git commit -m "feat: rename presenter-mode toggle to Show/Hide Explanations, default to hidden"
```

---

### Task 2: `Explain` — the per-paragraph reveal component

**Files:**
- Create: `web/components/Explain.tsx`
- Test: `web/components/Explain.test.tsx`

**Interfaces:**
- Consumes: `usePresenterMode()` from `web/lib/presenter/PresenterModeContext.tsx` (Task 1's renamed shape).
- Produces: `Explain({ children }: { children: ReactNode }) => JSX.Element` — renders `children` when globally shown or individually revealed; otherwise renders a `?` button that reveals just this instance.

- [ ] **Step 1: Write the failing tests**

Create `web/components/Explain.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { PresenterModeProvider } from "@/lib/presenter/PresenterModeContext";
import { PresenterModeToggle } from "./PresenterModeToggle";
import { Explain } from "./Explain";

describe("Explain", () => {
  it("hides children behind a '?' button by default", () => {
    render(
      <PresenterModeProvider>
        <Explain>
          <p>Secret explanation</p>
        </Explain>
      </PresenterModeProvider>
    );
    expect(screen.queryByText("Secret explanation")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show explanation" })).toBeInTheDocument();
  });

  it("reveals children when its own '?' button is clicked, without touching global state", async () => {
    const user = userEvent.setup();
    render(
      <PresenterModeProvider>
        <PresenterModeToggle />
        <Explain>
          <p>Secret explanation</p>
        </Explain>
      </PresenterModeProvider>
    );
    await user.click(screen.getByRole("button", { name: "Show explanation" }));
    expect(screen.getByText("Secret explanation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Explanations" })).toBeInTheDocument();
  });

  it("reveals children when the global toggle is switched on, with no '?' click needed", async () => {
    const user = userEvent.setup();
    render(
      <PresenterModeProvider>
        <PresenterModeToggle />
        <Explain>
          <p>Secret explanation</p>
        </Explain>
      </PresenterModeProvider>
    );
    await user.click(screen.getByRole("button", { name: "Show Explanations" }));
    expect(screen.getByText("Secret explanation")).toBeInTheDocument();
  });

  it("resets an individually-revealed paragraph back to hidden when the global toggle cycles off again", async () => {
    const user = userEvent.setup();
    render(
      <PresenterModeProvider>
        <PresenterModeToggle />
        <Explain>
          <p>Secret explanation</p>
        </Explain>
      </PresenterModeProvider>
    );
    await user.click(screen.getByRole("button", { name: "Show explanation" }));
    expect(screen.getByText("Secret explanation")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Explanations" }));
    await user.click(screen.getByRole("button", { name: "Hide Explanations" }));

    expect(screen.queryByText("Secret explanation")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show explanation" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npm run test -- Explain.test.tsx`
Expected: FAIL — `Explain.tsx` does not exist.

- [ ] **Step 3: Create `Explain.tsx`**

Create `web/components/Explain.tsx`:

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePresenterMode } from "@/lib/presenter/PresenterModeContext";

export function Explain({ children }: { children: ReactNode }) {
  const { showExplanations } = usePresenterMode();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!showExplanations) setRevealed(false);
  }, [showExplanations]);

  if (showExplanations || revealed) return <>{children}</>;

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      aria-label="Show explanation"
      className="flex h-6 w-6 items-center justify-center rounded-full border border-ocean/20 text-xs text-ocean"
    >
      ?
    </button>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd web && npm run test -- Explain.test.tsx`
Expected: PASS, all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add web/components/Explain.tsx web/components/Explain.test.tsx
git commit -m "feat: add Explain component for per-paragraph explanation reveal"
```

---

### Task 3: Wire `Explain` into `ReportSection`'s four intro paragraphs

**Files:**
- Modify: `web/components/ReportSection.tsx`
- Modify: `web/components/ReportSection.test.tsx`

**Interfaces:**
- Consumes: `Explain` from Task 2.
- Produces: no new exports — `ReportSection`'s external signature (`{ title, report }`) is unchanged.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `web/components/ReportSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ReportSection } from "./ReportSection";
import { PresenterModeProvider } from "@/lib/presenter/PresenterModeContext";
import { PresenterModeToggle } from "./PresenterModeToggle";
import type { PricingReport } from "@/lib/data/types";

function buildReport(): PricingReport {
  return {
    meta: {
      client: "Stories",
      report_date: "2026-07-22",
      currency: "LBP",
      fx_usd_rate: 89600,
      fx_rate_date: "2026-07-20",
      fx_source: "test",
      own_brand: "Stories",
      competitors: ["Pinkberry"],
    },
    products: [
      {
        category: "Frozen Yogurt",
        product: "Original Yogurt SMALL",
        prices_lbp: { Stories: 500000, Pinkberry: 450000 },
        own_price_lbp: 500000,
        competitor_avg_lbp: 450000,
        price_index: 111.1,
        comparability: "high",
        tier: "Core",
        is_outlier: false,
        outlier_direction: null,
      },
    ],
    categories: [
      { category: "Frozen Yogurt", product_count: 1, countable_product_count: 1, avg_price_index: 111.1 },
    ],
    data_quality_warnings: [],
  };
}

describe("ReportSection", () => {
  it("renders the group title and all five sub-views once explanations are shown", async () => {
    const user = userEvent.setup();
    render(
      <PresenterModeProvider>
        <PresenterModeToggle />
        <ReportSection title="Frozen Yogurt Bar" report={buildReport()} />
      </PresenterModeProvider>
    );

    await user.click(screen.getByRole("button", { name: "Show Explanations" }));

    expect(screen.getByRole("heading", { level: 2, name: "Frozen Yogurt Bar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Competitive Landscape at a Glance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Category Positioning" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Price Positioning Map" })).toBeInTheDocument();
    expect(screen.getByText("Findings & Recommendations")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Full Data Explorer" })).toBeInTheDocument();
    expect(screen.getByTestId("category-brand-heatmap")).toBeInTheDocument();
  });

  it("hides each sub-view's intro paragraph by default, while the sub-view's real content stays visible", () => {
    render(
      <PresenterModeProvider>
        <ReportSection title="Frozen Yogurt Bar" report={buildReport()} />
      </PresenterModeProvider>
    );

    expect(screen.queryByText(/Every category against every brand in one grid/)).not.toBeInTheDocument();
    expect(screen.queryByText(/competitor-only average in each category/)).not.toBeInTheDocument();
    expect(screen.queryByText(/average price per category/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Every priced line item, with search/)).not.toBeInTheDocument();

    // Headings and the actual chart content are unaffected — only the
    // explanatory prose paragraphs are behind the reveal.
    expect(screen.getByRole("heading", { level: 3, name: "Competitive Landscape at a Glance" })).toBeInTheDocument();
    expect(screen.getByTestId("category-brand-heatmap")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd web && npm run test -- ReportSection.test.tsx`
Expected: FAIL on the second test — the four intro paragraphs currently render unconditionally, so `queryByText` finds them instead of finding nothing.

- [ ] **Step 3: Wrap each intro paragraph in `Explain`**

Replace the full contents of `web/components/ReportSection.tsx`:

```tsx
import type { PricingReport } from "@/lib/data/types";
import { prepareCategoryPositioning } from "@/lib/analytics/categoryPositioning";
import { groupOutlierFindings } from "@/lib/analytics/findings";
import { buildCategoryPriceMap } from "@/lib/analytics/positioningMap";
import { buildCategoryBrandHeatmap } from "@/lib/analytics/heatmap";
import { CategoryBrandHeatmap } from "@/components/CategoryBrandHeatmap";
import { CategoryPositioning } from "@/components/CategoryPositioning";
import { CategoryPriceMap } from "@/components/CategoryPriceMap";
import { FindingsRecommendations } from "@/components/FindingsRecommendations";
import { DataExplorer } from "@/components/DataExplorer";
import { Section } from "@/components/Section";
import { Explain } from "@/components/Explain";

export function ReportSection({ title, report }: { title: string; report: PricingReport }) {
  const positioningRows = prepareCategoryPositioning(report.categories);
  const findings = groupOutlierFindings(report.products);
  const priceMapRows = buildCategoryPriceMap(report.products, report.meta.own_brand);
  const allBrands = [report.meta.own_brand, ...report.meta.competitors];
  const heatmapRows = buildCategoryBrandHeatmap(priceMapRows, allBrands);

  return (
    <section aria-label={title} className="border-b border-ocean/10 pb-12 pt-12">
      <h2 className="mb-6 font-display text-2xl text-ocean">{title}</h2>

      <Section title="Competitive Landscape at a Glance" level={3}>
        <Explain>
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            Every category against every brand in one grid — each cell is that brand&apos;s average price
            relative to the other brands priced in that category (100 = at par with peers). Red = priced above
            peers, violet = priced below. A blank cell means that brand doesn&apos;t sell in that category at
            all; a light gray cell with a price on it means the item is priced but no competitor sells there to
            benchmark against — see the full legend below the grid. {report.meta.client}&apos;s column is
            outlined.
          </p>
        </Explain>
        <CategoryBrandHeatmap rows={heatmapRows} brands={allBrands} ownBrand={report.meta.own_brand} />
      </Section>

      <Section title="Category Positioning" level={3}>
        <Explain>
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            A closer, {report.meta.client}-focused view: how far {report.meta.client} sits above or below the
            competitor-only average in each category. This is the same relationship as the heatmap above, isolated
            to {report.meta.client} and shown as a deviation from market rather than an index.
          </p>
        </Explain>
        <CategoryPositioning rows={positioningRows} />
      </Section>

      <Section title="Price Positioning Map" level={3}>
        <Explain>
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            Every brand&apos;s average price per category. {report.meta.client} is shown in Ocean with a bold
            outline; each competitor has its own color (see legend). The shaded band marks the competitor price
            range — where {report.meta.client}&apos;s dot falls inside, at the edge, or outside that band is the
            read. Filter to a single category for a closer look.
          </p>
        </Explain>
        <CategoryPriceMap rows={priceMapRows} fxRate={report.meta.fx_usd_rate} ownBrand={report.meta.own_brand} />
      </Section>

      <FindingsRecommendations findings={findings} fxRate={report.meta.fx_usd_rate} />

      <Section title="Full Data Explorer" level={3} last>
        <Explain>
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            Every priced line item, with search, filters, and sortable columns. Click a row to see every brand&apos;s
            price for that item side by side — not just {report.meta.client}&apos;s.
          </p>
        </Explain>
        <DataExplorer products={report.products} fxRate={report.meta.fx_usd_rate} ownBrand={report.meta.own_brand} />
      </Section>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd web && npm run test -- ReportSection.test.tsx`
Expected: PASS, both tests.

- [ ] **Step 5: Commit**

```bash
git add web/components/ReportSection.tsx web/components/ReportSection.test.tsx
git commit -m "feat: hide ReportSection intro paragraphs behind Explain by default"
```

---

### Task 4: Wire `Explain` into `page.tsx`, full verification

**Files:**
- Modify: `web/app/page.tsx`

**Interfaces:**
- Consumes: `Explain` from Task 2.
- Produces: the composed page — no new exports.

This task has no dedicated new test file (matching the existing codebase's convention — there is no `page.test.tsx`). Verification is the full test suite, `tsc --noEmit`, a production build, and a manual browser check.

- [ ] **Step 1: Wrap the cover intro paragraph, Methodology body, and Categories In Progress intro paragraph**

In `web/app/page.tsx`, add to the import list:

```tsx
import { Explain } from "@/components/Explain";
```

Change the cover's intro paragraph from:

```tsx
          <p className="mt-3 max-w-2xl text-sm text-ocean-muted">
            A full-menu competitive price positioning analysis for {mainReport.meta.client}, broken out by
            category group — each benchmarked against its own set of competitors.
          </p>
```

to:

```tsx
          <Explain>
            <p className="mt-3 max-w-2xl text-sm text-ocean-muted">
              A full-menu competitive price positioning analysis for {mainReport.meta.client}, broken out by
              category group — each benchmarked against its own set of competitors.
            </p>
          </Explain>
```

(The "Pricing Strategy Advisory" eyebrow label and the `<h1>` title above it are unchanged — only the descriptive sentence is wrapped.)

Change the Methodology section from:

```tsx
        <Section title="Methodology & Data Sources">
          <Methodology meta={mainReport.meta} warnings={mainReport.data_quality_warnings} />
        </Section>
```

to:

```tsx
        <Section title="Methodology & Data Sources">
          <Explain>
            <Methodology meta={mainReport.meta} warnings={mainReport.data_quality_warnings} />
          </Explain>
        </Section>
```

(The "Methodology & Data Sources" heading, rendered by `Section`, stays always visible — only `Methodology`'s entire body, all three of its internal sub-blocks, is behind the one reveal.)

Change the Categories In Progress intro paragraph from:

```tsx
        <Section title="Categories In Progress" last>
          <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
            These categories are moving to their own dedicated competitor comparison — shown here once{" "}
            {mainReport.meta.client} provides that data.
          </p>
          <CategoriesInProgress categories={PENDING_CATEGORIES} />
        </Section>
```

to:

```tsx
        <Section title="Categories In Progress" last>
          <Explain>
            <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
              These categories are moving to their own dedicated competitor comparison — shown here once{" "}
              {mainReport.meta.client} provides that data.
            </p>
          </Explain>
          <CategoriesInProgress categories={PENDING_CATEGORIES} />
        </Section>
```

No other line in `page.tsx` changes — the Executive Summary section, Context Bar, footer, and the three `<ReportSection>` instances are untouched by this task (their own internals were handled in Task 3).

- [ ] **Step 2: Run the full frontend test suite**

Run: `cd web && npm run test`
Expected: all PASS, including every test from Tasks 1–3.

- [ ] **Step 3: Type-check**

Run: `cd web && npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Build the static export**

Run: `cd web && npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 5: Manually verify in the browser**

Run: `cd web && npm run dev`, open `http://localhost:3000`. Confirm:
- On first load, the top-right button reads "Show Explanations," and no explanatory paragraphs are visible anywhere on the page — cover intro, all `ReportSection` intro paragraphs (heatmap/positioning/price map/explorer, ×3 reports), Methodology & Data Sources body, Categories In Progress intro, and Findings & Recommendations are all absent, each replaced by a small "?" where the paragraph would be (except Findings & Recommendations, which is fully absent including its heading, per its unchanged whole-section behavior).
- Clicking any individual "?" reveals just that one paragraph; the global button still reads "Show Explanations."
- Clicking "Show Explanations" reveals everything at once (all paragraphs, Methodology's full body, Findings & Recommendations) and the button now reads "Hide Explanations."
- Clicking "Hide Explanations" hides everything again, including any paragraph that had been individually revealed via its own "?" — no stale revealed state survives the global toggle-off.
- Section headings (h2/h3), charts, tables, the Executive Summary, Context Bar, and footer are visible at all times regardless of the toggle.

- [ ] **Step 6: Commit**

```bash
git add web/app/page.tsx
git commit -m "feat: hide cover intro, Methodology, and Categories In Progress paragraphs behind Explain"
```
