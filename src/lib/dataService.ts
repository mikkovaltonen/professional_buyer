export interface TimeSeriesData {
  Year_Month: string;
  prod_class: string;
  prodgroup: string;
  prodcode: string;
  proddesc1: string;
  Quantity: number | null;
  new_forecast: number | null;
  old_forecast: number | null;
  old_forecast_error: number | null;
  correction_percent?: number | null;
  explanation?: string | null;
  new_forecast_manually_adjusted: number | null;
  correction_timestamp?: string | null;
}

export interface ForecastCorrection {
  product_group?: string;
  product_code?: string;
  month: string;
  correction_percent: number;
  explanation: string;
  forecast_corrector?: string;
  prod_class?: string;
}

export class DataService {
  private static instance: DataService;
  private data: TimeSeriesData[] = [];
  private baseUrl = '/api';
  private authToken: string;

  private constructor() {
    this.authToken = 'fm91Lp8IhmZfIAFhwmx2Gb2fhDJZmsV4XaRDPse5zWfwYpURMcKJI7kS7QLbiiU5';
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  public async loadForecastData(): Promise<TimeSeriesData[]> {
    console.log('[DataService] loadForecastData: Attempting to load forecast data...');
    if (this.data.length > 0) {
      console.log(`[DataService] loadForecastData: Data already in memory (${this.data.length} rows), returning cached data.`);
      return this.data;
    }

    try {
      console.log('[DataService] loadForecastData: Fetching data from REST API.');
      console.log(`[DataService] loadForecastData: Using baseUrl: ${this.baseUrl}`);
      console.log(`[DataService] loadForecastData: Auth token present: ${!!this.authToken}`);
      
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`[DataService] loadForecastData: Response status: ${response.status}`);
      console.log(`[DataService] loadForecastData: Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DataService] loadForecastData: API error response:', errorText);
        throw new Error(`Failed to fetch data from REST API: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const rawData = await response.json();
      console.log('[DataService] loadForecastData: Received raw data structure:', {
        hasData: !!rawData,
        hasResults: !!rawData?.results,
        resultsIsArray: Array.isArray(rawData?.results),
        resultsLength: rawData?.results?.length
      });
      
      if (!rawData || !rawData.results || !Array.isArray(rawData.results)) {
        console.error('[DataService] loadForecastData: Invalid data format in REST API response:', rawData);
        throw new Error('Invalid data format in REST API response');
      }

      this.data = rawData.results.map((row: any) => normalizeTimeSeriesData(row));

      console.log(`[DataService] loadForecastData: Successfully loaded and processed ${this.data.length} rows from REST API.`);
      if (this.data.length > 0) {
        const sample = this.data[0];
        console.log(`[DataService] loadForecastData: Sample processed row:`, {
          Year_Month: sample.Year_Month,
          Product_Group: sample.prodgroup,
          Product_Code: sample.prodcode,
          Product_Description: sample.proddesc1,
          Quantity: sample.Quantity,
          New_Forecast: sample.new_forecast,
          Old_Forecast: sample.old_forecast
        });
      }
      return this.data;
    } catch (error) {
      console.error('[DataService] loadForecastData: Failed to load data from REST API:', error);
      if (error instanceof Error) {
        console.error('[DataService] loadForecastData: Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  public getAllData(): TimeSeriesData[] {
    return this.data;
  }

  public getDataByClass(productClass: string): TimeSeriesData[] {
    return this.data.filter(row => row.prod_class === productClass);
  }

  public getProductGroupsInClass(productClass: string): string[] {
    const groups = new Set(this.data
      .filter(row => row.prod_class === productClass)
      .map(row => row.prodgroup));
    return Array.from(groups);
  }

  public getProductsInGroup(productGroup: string): { code: string; description: string }[] {
    const products = new Map<string, string>();
    this.data
      .filter(row => row.prodgroup === productGroup)
      .forEach(row => {
        if (row.prodcode && row.proddesc1) {
          products.set(row.prodcode, row.proddesc1);
        }
      });
    return Array.from(products.entries()).map(([code, description]) => ({ code, description }));
  }

  public getProductData(productCode: string): TimeSeriesData[] {
    return this.data
      .filter(row => row.prodcode === productCode)
      .sort((a, b) => new Date(a.Year_Month).getTime() - new Date(b.Year_Month).getTime());
  }

  public getProductGroupData(productGroup: string): TimeSeriesData[] {
    const groupData = this.data.filter(row => row.prodgroup === productGroup);
    
    // Get unique dates
    const dates = [...new Set(groupData.map(row => row.Year_Month))];
    
    // Create aggregated data by summing quantities for each date
    const aggregatedData = dates.map(date => {
      const rowsForDate = groupData.filter(row => row.Year_Month === date);
      
      // Only sum non-empty values
      const totalQuantity = rowsForDate
        .filter(row => row.Quantity !== null)
        .reduce((sum, row) => sum + (row.Quantity || 0), 0);

      const totalNewForecast = rowsForDate
        .filter(row => row.new_forecast !== null)
        .reduce((sum, row) => sum + (row.new_forecast || 0), 0);

      const totalNewForecastAdjusted = rowsForDate
        .filter(row => row.new_forecast_manually_adjusted !== null)
        .reduce((sum, row) => sum + (row.new_forecast_manually_adjusted || 0), 0);

      const totalOldForecast = rowsForDate
        .filter(row => row.old_forecast !== null)
        .reduce((sum, row) => sum + (row.old_forecast || 0), 0);

      // If all values for a metric are empty, return null
      const hasQuantity = rowsForDate.some(row => row.Quantity !== null);
      const hasNewForecast = rowsForDate.some(row => row.new_forecast !== null);
      const hasNewForecastAdjusted = rowsForDate.some(row => row.new_forecast_manually_adjusted !== null);
      const hasOldForecast = rowsForDate.some(row => row.old_forecast !== null);

      // Get the latest explanation and correction info for this date
      const latestAdjustment = rowsForDate
        .filter(row => row.correction_timestamp && row.explanation)
        .sort((a, b) => {
          const timeA = a.correction_timestamp ? new Date(a.correction_timestamp).getTime() : 0;
          const timeB = b.correction_timestamp ? new Date(b.correction_timestamp).getTime() : 0;
          return timeB - timeA;  // Sort in descending order (latest first)
        })[0];
      
      return {
        Year_Month: date,
        prod_class: rowsForDate[0]?.prod_class || "",
        prodgroup: productGroup,
        prodcode: "GROUP_TOTAL",
        proddesc1: `${productGroup} Total`,
        Quantity: hasQuantity ? totalQuantity : null,
        new_forecast: hasNewForecast ? totalNewForecast : null,
        new_forecast_manually_adjusted: hasNewForecastAdjusted ? totalNewForecastAdjusted : null,
        old_forecast: hasOldForecast ? totalOldForecast : null,
        old_forecast_error: null,
        correction_percent: latestAdjustment?.correction_percent || null,
        explanation: latestAdjustment?.explanation || null,
        correction_timestamp: latestAdjustment?.correction_timestamp || null
      };
    });

    // Sort by date
    return aggregatedData.sort((a, b) => 
      new Date(a.Year_Month).getTime() - new Date(b.Year_Month).getTime()
    );
  }

  public getUniqueProductClasses(): string[] {
    const classes = new Set(this.data.map(row => row.prod_class));
    return Array.from(classes);
  }

  public clearCache(): void {
    this.data = [];
  }
}

export function normalizeTimeSeriesData(row: any): TimeSeriesData {
  return {
    Year_Month: row.Year_Month,
    prod_class: row.prod_class,
    prodgroup: row.prodgroup,
    prodcode: row.prodcode,
    proddesc1: row.proddesc1,
    Quantity: row.Quantity,
    new_forecast: row.new_forecast,
    old_forecast: row.old_forecast,
    old_forecast_error: row.old_forecast_error,
    correction_percent: row.correction_percent,
    explanation: row.explanation,
    new_forecast_manually_adjusted: row.new_forecast_manually_adjusted,
    correction_timestamp: row.correction_timestamp
  };
} 