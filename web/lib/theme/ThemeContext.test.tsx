import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

function Probe() {
  const { theme, toggle } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggle}>toggle</button>
    </div>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to light", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-value")).toHaveTextContent("light");
  });

  it("toggles to dark, sets the data-theme attribute, and persists to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    await user.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(window.localStorage.getItem("stories-theme")).toBe("dark");
  });

  it("toggling back to light updates the attribute and storage too", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    await user.click(screen.getByText("toggle"));
    await user.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme-value")).toHaveTextContent("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem("stories-theme")).toBe("light");
  });

  it("reads a previously stored dark preference on mount", () => {
    window.localStorage.setItem("stories-theme", "dark");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
  });
});
