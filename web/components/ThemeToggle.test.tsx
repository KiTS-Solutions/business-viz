import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("switches its accessible label after a click", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });
});
