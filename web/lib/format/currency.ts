export function formatLbp(value: number): string {
  return `${Math.round(value).toLocaleString("en-US")} LBP`;
}

export function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDualCurrency(lbp: number, fxRate: number): string {
  const usd = lbp / fxRate;
  return `${formatLbp(lbp)} (${formatUsd(usd)})`;
}
