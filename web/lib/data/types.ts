export interface ProductAnalytics {
  category: string;
  product: string;
  prices_lbp: Record<string, number>;
  own_price_lbp: number | null;
  competitor_avg_lbp: number | null;
  price_index: number | null;
  comparability: "high" | "medium" | "low";
  tier: "Value" | "Core" | "Premium" | null;
  is_outlier: boolean;
  outlier_direction: "overpriced" | "underpriced" | null;
}

export interface CategoryRollup {
  category: string;
  product_count: number;
  countable_product_count: number;
  avg_price_index: number | null;
}

export interface ReportMeta {
  client: string;
  report_date: string;
  currency: string;
  fx_usd_rate: number;
  fx_rate_date: string;
  fx_source: string;
  own_brand: string;
  competitors: string[];
  generated_from?: string;
}

export interface DataQualityWarning {
  category: string;
  product: string;
  brand: string;
  conflicting_prices_lbp: number[];
}

export interface PricingReport {
  meta: ReportMeta;
  products: ProductAnalytics[];
  categories: CategoryRollup[];
  data_quality_warnings: DataQualityWarning[];
}
