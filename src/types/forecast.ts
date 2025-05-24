export interface ForecastCorrection {
  product_group?: string;
  product_code?: string;
  month: string;
  correction_percent: number;
  explanation: string;
  correction_timestamp?: string;
} 