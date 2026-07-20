import fs from "node:fs";
import path from "node:path";
import type { PricingReport } from "./types";

const PROCESSED_DIR = path.join(process.cwd(), "..", "processed");

export function listReportSlugs(): string[] {
  return fs
    .readdirSync(PROCESSED_DIR)
    .filter((name) => name.endsWith(".json") && !name.endsWith(".normalized.json"))
    .map((name) => name.replace(/\.json$/, ""));
}

export function loadReport(slug: string): PricingReport {
  const filePath = path.join(PROCESSED_DIR, `${slug}.json`);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as PricingReport;
}
