"use client";

import { useTheme } from "@/lib/theme/ThemeContext";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-ocean/20 text-sm text-ocean"
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
}
