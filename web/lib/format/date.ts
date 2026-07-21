const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * The pipeline stores report_date as an ISO date (YYYY-MM-DD) for machine
 * use, but the source data only ever specifies a month (e.g. the raw file is
 * named "...March 2026", no specific day) — the day component is a filler
 * value, not a real fact. Displaying the raw ISO string ("2026-03-01") is
 * also genuinely ambiguous outside YYYY-MM-DD-literate readers, easily
 * misread as DD-MM-YYYY. This formats to an unambiguous "Month Year" that
 * doesn't imply false day-level precision.
 */
export function formatReportPeriod(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month] = match;
  const monthName = MONTHS[Number(month) - 1];
  return monthName ? `${monthName} ${year}` : isoDate;
}

/**
 * Unlike report_date, fx_rate_date is a real, precise fact (the actual day
 * the exchange rate was looked up) — day-level precision is kept, unlike
 * formatReportPeriod. Still spelled out rather than shown as raw ISO
 * ("2026-07-20"), which is exactly as ambiguous/misreadable as report_date
 * was — this was the second occurrence of that same bug, just on a
 * different field, missed in the first pass.
 */
export function formatFullDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  return monthName ? `${monthName} ${Number(day)}, ${year}` : isoDate;
}
