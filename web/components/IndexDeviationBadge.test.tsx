import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { IndexDeviationBadge } from "./IndexDeviationBadge";

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("IndexDeviationBadge", () => {
  it("renders a red up-arrow with the deviation percent when index is above 100", () => {
    renderWithTheme(<IndexDeviationBadge value={120} />);
    expect(screen.getByText("▲ 20%")).toBeInTheDocument();
  });

  it("renders a violet down-arrow with the deviation percent when index is below 100", () => {
    renderWithTheme(<IndexDeviationBadge value={80} />);
    expect(screen.getByText("▼ 20%")).toBeInTheDocument();
  });

  it("renders a neutral 'at par' label when index is exactly 100", () => {
    renderWithTheme(<IndexDeviationBadge value={100} />);
    expect(screen.getByText("at par")).toBeInTheDocument();
  });

  it("renders nothing when value is null", () => {
    const { container } = renderWithTheme(<IndexDeviationBadge value={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("omits the inline semantic color when inheritColor is set", () => {
    renderWithTheme(<IndexDeviationBadge value={120} inheritColor />);
    const el = screen.getByText("▲ 20%");
    expect(el.style.color).toBe("");
  });
});
