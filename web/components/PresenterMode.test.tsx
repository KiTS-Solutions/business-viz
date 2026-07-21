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

    expect(screen.getByText(/Repricing Candidates/)).toBeInTheDocument();
    expect(screen.getByText("Findings & Recommendations")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide Recommendations" }));
    expect(screen.queryByText(/Repricing Candidates/)).not.toBeInTheDocument();
    // The heading itself must also disappear — it used to be rendered by an
    // outer wrapper regardless of presenter mode, leaving a bare heading
    // floating over no content.
    expect(screen.queryByText("Findings & Recommendations")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Recommendations" }));
    expect(screen.getByText(/Repricing Candidates/)).toBeInTheDocument();
    expect(screen.getByText("Findings & Recommendations")).toBeInTheDocument();
  });
});
