# Design Spec: Stories Pricing Benchmark Dashboard & Reusable Data-to-Deliverable Pipeline

**Date:** 2026-07-20
**Client:** Stories (café/F&B brand), engagement led by Ru'ya 360 / KiTS
**Author:** Kits (assistant) + user, via brainstorming session
**Status:** Approved by user, ready for implementation planning

## 1. Purpose

Stories has commissioned a pricing strategy advisory engagement. The starting input is a raw Excel pricing comparison (`raw-data/Product Pricing Comparison March 2026 (1).xlsx`) benchmarking Stories' menu against four competitors (Espresso Lab, Dunkin Donuts, Joe & the Juice, Starbucks) across 591 SKUs in 24 menu categories.

This spec covers two things:
1. A **reusable pipeline** that turns any raw pricing-comparison Excel file into structured, analyzed data — general enough to handle future data drops (recurring Stories updates, new data types, or entirely new clients), not hardcoded to this one file.
2. The **interactive web dashboard** built on top of that pipeline for this specific engagement, serving as both a client presentation tool (executives) and an operational data explorer (Stories' ops/pricing team) in one deliverable.

## 2. Source Data Summary

- Single sheet, 617 rows, 591 product line items across 24 categories (Black Coffee, Brewed Coffee, Mixed Hot/Cold Beverages, Blended Drinks, Tea, Signature, Pastries, Sandwiches, Frozen Yogurt, Pizza, etc.)
- Columns: Stories (client) + 4 competitors, plus source-computed Average and Difference columns
- Prices in LBP. Coverage is uneven: Stories priced on 52.5% of line items; competitors range 14.4%–29.3%.
- Category rows are visually distinguished (merged cells, fill color) as section headers in the source file.
- **Methodology issue found in source file:** its "Average" column includes Stories' own price, which mechanically pulls the benchmark toward Stories and understates real pricing gaps (e.g. Americano Medium: source reports a −14,500 LBP gap vs. average; recomputed against competitors only, the true gap is −19,333 LBP, ~33% larger). This pipeline corrects for that (see §4).

## 3. Currency Handling

- Prices are LBP. Lebanon has no single clean official rate anymore (BDL's Sayrafa platform is stale/defunct); the de facto reference is the market/parallel rate.
- Display convention: **LBP as the primary figure everywhere, USD shown as a secondary/parenthetical equivalent only** — never the reverse.
- The FX rate is a **configurable, dated, sourced parameter** per report (never hardcoded in code) — e.g. for this report: ~89,600 LBP/USD as of 2026-07-20, sourced from lira-rate.com / lbprate.com market averages. Each report states the rate and its date/source explicitly (KiTS standard: currency specified with rate if converting).

## 4. Reusable Pipeline Architecture

### 4.1 Repository layout
```
/data/raw/              source Excel files, committed as-is (small files)
/data/sources/           one config JSON per report/data source
/data/processed/         generated normalized + analytics JSON (build artifact)
/scripts/                parse_pricing.py, analyze_pricing.py
/app/                    Next.js app (App Router, static export)
/docs/superpowers/specs/ design specs (this file and future ones)
```

### 4.2 Source config (hand-written once per data drop)
Drives the ETL without touching pipeline code:
```json
{
  "client": "Stories",
  "report_date": "2026-03-01",
  "currency": "LBP",
  "fx_usd_rate": 89600,
  "fx_rate_date": "2026-07-20",
  "fx_source": "lira-rate.com / lbprate.com market average",
  "own_brand": "Stories",
  "competitors": ["Espresso Lab", "Dunkin Donuts", "Joe & the Juice", "Starbucks"]
}
```

### 4.3 ETL (`scripts/parse_pricing.py`)
- Generic Python script driven entirely by the source config — no client-specific logic hardcoded.
- Auto-detects category header rows via the merged/blank-row pattern observed in the source file.
- Normalizes `'-'` and blank cells to `null`.
- Outputs one normalized record per `{category, product, brand, price_lbp, price_usd}` plus a `meta` block (coverage %, row counts, source file, report_date).

### 4.4 Analytics (`scripts/analyze_pricing.py`)
Consumes the normalized JSON, produces the analytics JSON the dashboard renders. Computes:

1. **Corrected Price Index** per product: `Stories Price ÷ Competitor-Only Average × 100` (excludes Stories from the average — fixes the source file's methodology issue in §2). Index 100 = at-par; <100 = below market; >100 = above market.
2. **Comparability flag** per product: `high` (3+ competitors priced), `medium` (2), `low` (0-1). Low-comparability items are excluded from category roll-ups and visually deprioritized, but remain visible in the full data appendix.
3. **Category roll-ups**: average index per category, weighted only by medium/high-comparability items.
4. **Positioning tiers**: quartile-based Value / Core / Premium bands per category.
5. **Outlier / recommendation candidates**: items with `|index − 100| ≥ 15%` (threshold tunable) and comparability ≥ medium, flagged as repricing candidates for the optional Recommendations view.

### 4.5 Adding future data
New Stories period, new data type, or new client: drop the Excel into `/data/raw/`, add one config JSON, run the build. No pipeline code changes required. The dashboard's landing view lists all available reports, so this grows into a report archive without redesign.

## 5. Dashboard Structure (Information Architecture)

Single-page dashboard, ordered to work both as a live meeting walkthrough and a standalone explorer:

1. **Cover / Context bar** — client, report title, period, data sources, FX rate + date + source, coverage caveat headline. Persistent, compact (not a wall of text).
2. **Executive Summary** — 4-6 KPI tiles: overall price index vs. market, categories above/below market, coverage %, top 3 over/under-indexed categories.
3. **Category Positioning View** — core visual; Stories' index vs. competitor spread per category, filterable/sortable. Exact chart type decided at implementation time via the `dataviz` skill.
4. **Findings & Recommendations** — toggle-able (presenter mode, see §6): outlier products grouped into "repricing candidates (overpriced)" and "trade-up opportunities (underpriced)," each showing index, comparability, and competitor prices.
5. **Full Data Explorer / Appendix** — searchable/filterable/sortable table of all 591 lines; serves both the ops-team audience and as the "show your work" backing for the executive layer.

Currency shown as LBP with USD equivalent throughout, per §3.

## 6. Presenter Mode

A UI-level toggle (not a data-layer change) to show/hide the Findings & Recommendations layer, so the same dashboard can run a "facts-only" walkthrough or a "here's what we recommend" walkthrough depending on how the client meeting is run.

## 7. Visual Design & Branding

Built on the Ru'ya 360 brand system (`Branding/Brand Guidelines _ Ru_ya.pdf`, `Branding/Colour Palette/Color Palette.pdf`):

- **Typography:** Clash Display Variable for headlines/KPI numbers/section titles; Montserrat for body copy, tables, captions.
- **Structural color (80% primary):** `#2f5b6b` (Ocean) as dominant UI color for headers/nav/text; `#ffffff` base background; `#e7e569` (Lime Dust) as a sparing accent only.
- **Data/accent color (20% secondary):** `#66c4dd`, `#2b96af`, `#ea5c3f`, `#f7b759` assigned consistently as competitor brand colors in charts. Stories always renders in Ocean `#2f5b6b` so it reads as "us" at a glance across every chart.
- **Semantic indicators:** over/under-indexed communicated via icon + label + a restrained red/green pair **reserved exclusively for this purpose**, kept separate from the brand accent palette so "whose price is this" (brand color) and "is this good/bad" (semantic color) never collide. Exact accessible values chosen at implementation time via the `dataviz` skill.
- **Attribution:** Ru'ya 360 logo in header per their spacing/usage rules (never resized or altered); "Prepared for Stories" attribution; report date and confidentiality line in footer.

## 8. Deployment & Reproducibility

- **Build:** `npm run build` runs the Python ETL/analytics scripts (prebuild step) to regenerate `/data/processed/*.json` from whatever is in `/data/sources/`, then `next build` with `output: 'export'` produces static output.
- **Now:** GitHub Actions workflow on push to `main` builds and publishes to GitHub Pages.
- **Later:** same repo connects to Vercel directly (auto-detects Next.js) — no pipeline rework, just a hosting swap.
- **Git hygiene:** raw Excel files are committed (source of truth, small). `.gitignore` excludes LibreOffice lock files (`.~lock.*`) and local build output.

## 9. Non-Goals (for this phase)

- No database/backend — static export only, per current scope.
- No authentication/access control on the initial GitHub Pages deployment (flagged as a future consideration if hosting moves to a client-accessible URL between meetings).
- No automated trend-over-time analysis yet — the schema supports it (`report_date` per source) but multi-period comparison logic is out of scope until a second data drop actually arrives.

## 10. Open Assumptions to Confirm During Implementation

- Exact chart types for the Category Positioning View (dot/range chart vs. alternative) — decided using the `dataviz` skill during implementation, not fixed here.
- Exact accessible hex values for the semantic red/green pair — chosen during implementation, not fixed here.
- Outlier threshold of ±15% is a starting default; may be tuned after seeing real category-level distributions.
