import { loadReport, loadCupSizeTable } from "@/lib/data/loadReport";
import { filterReportByCategories } from "@/lib/data/filterReport";
import { withBasePath } from "@/lib/basePath";
import { formatReportPeriod } from "@/lib/format/date";
import { cleanDisplayFileName } from "@/lib/format/filename";
import { computeReportScorecard } from "@/lib/analytics/scorecard";
import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { ReportSection } from "@/components/ReportSection";
import { CategoriesInProgress } from "@/components/CategoriesInProgress";
import { CupSizeComparison } from "@/components/CupSizeComparison";
import { Explain } from "@/components/Explain";
import { PresenterModeToggle } from "@/components/PresenterModeToggle";
import { ContextBar } from "@/components/ContextBar";
import { Methodology } from "@/components/Methodology";
import { Section } from "@/components/Section";
import { PresenterModeProvider } from "@/lib/presenter/PresenterModeContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const PENDING_CATEGORIES = [
  "Milkshakes",
  "Protein Shakes",
  "Shakes",
  "Pizza",
  "Wraps",
  "Gluten Free",
  "Luxury Toppings",
];

// "Main Menu" isn't a real menu category — split it into the same groupings
// the client's own source spreadsheet uses (adjacent category-header blocks
// in raw-data/Product Pricing Comparison March 2026 (1).xlsx): a beverage
// block and a Croissants+Pastries block. Shakes is excluded — the source
// data has zero Stories prices in that category (only a Joe & the Juice
// competitor price), so it isn't a real Stories-vs-competitor comparison;
// moved to Categories In Progress until Stories' own shake prices exist.
const DRINKS_CATEGORIES = [
  "Black Coffee", "Brewed Coffee", "Mixed Hot Beverages", "Blended Drinks",
  "Mixed Cold Beverages", "TEA", "Signature", "Soft Drinks & Juices",
  "Retail Coffee Beans", "Shots", "Add - Ons",
];
const BAKERY_CATEGORIES = ["Croissants", "Pastries"];

export default function Home() {
  const mainReport = loadReport("stories-pricing-2026-03");
  const frozenYogurtReport = loadReport("stories-frozen-yogurt-2026-07");
  const nonDairyReport = loadReport("stories-non-dairy-2026-07");
  const saladsReport = loadReport("stories-salads-2026-07");
  const platDuJourReport = loadReport("stories-plat-du-jour-2026-07");
  const sandwichesReport = loadReport("stories-sandwiches-2026-07");
  const cupSizeTable = loadCupSizeTable("stories-frozen-yogurt-cup-sizes-2026-07");

  const drinksReport = filterReportByCategories(mainReport, DRINKS_CATEGORIES);
  const bakeryReport = filterReportByCategories(mainReport, BAKERY_CATEGORIES);

  const scorecards = [
    computeReportScorecard(drinksReport, "Drinks"),
    computeReportScorecard(bakeryReport, "Bakery"),
    computeReportScorecard(frozenYogurtReport, "Frozen Yogurt Bar"),
    computeReportScorecard(nonDairyReport, "Non-Dairy Menu"),
    computeReportScorecard(saladsReport, "Salads"),
    computeReportScorecard(platDuJourReport, "Plat Du Jour"),
    computeReportScorecard(sandwichesReport, "Sandwiches"),
  ];

  return (
    <ThemeProvider>
    <PresenterModeProvider>
      {/* Cover */}
      <div className="border-b border-ocean/10 bg-page-bg px-6 pb-10 pt-8">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBasePath("/ruya-logo.jpg")} alt="Ru'ya 360" className="h-7 w-auto sm:h-9" />
            <span className="h-6 w-px bg-ocean/15 aria-hidden:true" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBasePath("/stories-logo.png")} alt="Stories" className="h-6 w-auto sm:h-7" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <PresenterModeToggle />
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl">
          <p className="text-xs uppercase tracking-widest text-ocean-muted">Pricing Strategy Advisory</p>
          <h1 className="mt-2 font-display text-4xl text-ocean sm:text-5xl">Stories Pricing Benchmark</h1>
          <span className="mt-2 block h-1 w-16 rounded-full bg-lime-dust" aria-hidden="true" />
          <Explain>
            <p className="mt-3 max-w-2xl text-sm text-ocean-muted">
              A full-menu competitive price positioning analysis for {mainReport.meta.client}, broken out by
              category group — each benchmarked against its own set of competitors.
            </p>
          </Explain>
        </div>
      </div>

      <ContextBar meta={mainReport.meta} />

      <main className="mx-auto max-w-6xl px-6">
        <Section title="Executive Summary" first>
          <ExecutiveSummary scorecards={scorecards} fxRate={mainReport.meta.fx_usd_rate} />
        </Section>

        <Section title="Methodology & Data Sources">
          <Explain>
            <Methodology meta={mainReport.meta} warnings={mainReport.data_quality_warnings} />
          </Explain>
        </Section>

        <ReportSection title="Drinks" report={drinksReport} />
        <ReportSection title="Bakery" report={bakeryReport} />
        <ReportSection
          title="Frozen Yogurt Bar"
          report={frozenYogurtReport}
          extra={
            <Section title="Cup Size Comparison (oz)" level={3}>
              <Explain>
                <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
                  Serving size in ounces per cup tier, {frozenYogurtReport.meta.client} vs. each competitor —
                  a physical-portion comparison, separate from price.
                </p>
              </Explain>
              <CupSizeComparison table={cupSizeTable} ownBrand={frozenYogurtReport.meta.own_brand} />
            </Section>
          }
        />
        <ReportSection title="Non-Dairy Menu" report={nonDairyReport} />
        <ReportSection title="Salads" report={saladsReport} />
        <ReportSection title="Plat Du Jour" report={platDuJourReport} />
        <ReportSection title="Sandwiches" report={sandwichesReport} />

        <Section title="Categories In Progress" last>
          <Explain>
            <p className="mb-5 max-w-2xl text-sm text-ocean-muted">
              These categories are moving to their own dedicated competitor comparison — shown here once{" "}
              {mainReport.meta.client} provides that data.
            </p>
          </Explain>
          <CategoriesInProgress categories={PENDING_CATEGORIES} />
        </Section>
      </main>

      <footer className="mt-4 border-t border-ocean/10 bg-ocean/5 px-6 py-6 text-xs text-ocean-muted">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p>Confidential — prepared for {mainReport.meta.client} by Ru&apos;ya 360. Not for external distribution.</p>
            <p className="mt-1">
              Report period: {formatReportPeriod(mainReport.meta.report_date)} · Source:{" "}
              {mainReport.meta.generated_from ? cleanDisplayFileName(mainReport.meta.generated_from) : "internal pricing data"}.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBasePath("/stories-logo.png")} alt="Stories" className="h-5 w-auto shrink-0 opacity-70" />
        </div>
      </footer>
    </PresenterModeProvider>
    </ThemeProvider>
  );
}
