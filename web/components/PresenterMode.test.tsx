import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { PresenterModeProvider } from "@/lib/presenter/PresenterModeContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
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
      <ThemeProvider>
        <PresenterModeProvider>
          <PresenterModeToggle />
          <FindingsRecommendations findings={findings} fxRate={89600} />
        </PresenterModeProvider>
      </ThemeProvider>
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
