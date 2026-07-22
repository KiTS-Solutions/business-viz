"use client";

import { themedSemanticColors } from "@/lib/theme/colors";
import { useTheme } from "@/lib/theme/ThemeContext";

/**
 * Small colored arrow + percent, shown alongside any raw price-index number
 * on the site — the deviation from 100 (the at-par baseline), e.g. index
 * 120 -> a red "▲20%"; index 80 -> a violet "▼20%". Reuses the same
 * red=overpriced/violet=underpriced convention as everywhere else on the
 * site (heatmap, Category Positioning, Data Explorer's index bar).
 */
export function IndexDeviationBadge({
  value,
  className = "",
  inheritColor = false,
}: {
  value: number | null;
  className?: string;
  /** Skip the semantic red/violet color and inherit the parent's text color
   * instead — for use inside an already color-coded surface (e.g. the
   * heatmap's own colored cell backgrounds), where a second, independent
   * color could clash or read poorly against the cell's own bg color. */
  inheritColor?: boolean;
}) {
  const { theme } = useTheme();
  if (value === null) return null;

  const deviation = Math.round(value - 100);
  if (deviation === 0) {
    return (
      <span className={`text-[10px] font-semibold ${inheritColor ? "" : "text-ocean-muted"} ${className}`}>
        at par
      </span>
    );
  }

  const semanticColors = themedSemanticColors(theme);
  const color = deviation > 0 ? semanticColors.overpriced : semanticColors.underpriced;
  const arrow = deviation > 0 ? "▲" : "▼";

  return (
    <span
      className={`text-[10px] font-semibold tabular-nums ${className}`}
      style={inheritColor ? undefined : { color }}
    >
      {arrow} {Math.abs(deviation)}%
    </span>
  );
}
