/**
 * Strips a download-duplicate suffix like " (1)" before the extension from a
 * displayed file name (e.g. "Report (1).xlsx" -> "Report.xlsx"). Purely a
 * display concern — the underlying meta.generated_from value (used for
 * provenance/audit) is left untouched; this only affects what a reader sees.
 */
export function cleanDisplayFileName(fileName: string): string {
  return fileName.replace(/\s\(\d+\)(\.\w+)$/, "$1");
}
