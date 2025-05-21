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
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DataService] loadForecastData: API error response:', errorText);
        throw new Error(`Failed to fetch data from REST API: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const rawData = await response.json();
      
      if (!rawData || !rawData.results || !Array.isArray(rawData.results)) {
        console.error('[DataService] loadForecastData: Invalid data format in REST API response:', rawData);
        throw new Error('Invalid data format in REST API response');
      }

      this.data = rawData.results.map((row: any) => normalizeTimeSeriesData(row));
      console.log(`[DataService] loadForecastData: Successfully loaded ${this.data.length} rows from REST API.`);
      
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

  public getProductsInGroup(productGroup: string, productClass?: string): { code: string; description: string }[] {
    let filteredData = this.data;
    if (productClass && productClass.trim() !== '') {
      filteredData = filteredData.filter(row => row.prod_class === productClass);
    }
    
    const products = new Map<string, string>();
    filteredData
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

  public getProductGroupData(productGroup: string, productClass?: string): TimeSeriesData[] {
    let initialData = this.data;
    if (productClass && productClass.trim() !== '') {
      initialData = initialData.filter(row => row.prod_class === productClass);
    }
    
    const groupData = initialData.filter(row => row.prodgroup === productGroup);
    
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

  public async applyCorrections(corrections: ForecastCorrection[]): Promise<void> {
    console.log('[DataService] applyCorrections: Starting to apply corrections...');
    
    if (!corrections || corrections.length === 0) {
      console.log('[DataService] applyCorrections: No corrections to apply');
      return;
    }

    try {
      // Process each correction
      for (const correction of corrections) {
        console.log('[DataService] applyCorrections: Processing correction:', correction);
        
        // Prepare the request body
        const requestBody = {
          Year_Month: correction.month,
          prod_class: correction.prod_class,
          prodgroup: correction.product_group,
          prodcode: correction.product_code,
          correction_percent: correction.correction_percent,
          explanation: correction.explanation,
          forecast_corrector: correction.forecast_corrector || 'system',
          correction_timestamp: new Date().toISOString()
        };

        console.log('[DataService] applyCorrections: Sending request with body:', requestBody);

        // Send the request to the REST API
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[DataService] applyCorrections: API error response:', errorText);
          throw new Error(`Failed to apply correction: ${response.status} ${response.statusText} - ${errorText}`);
        }

        console.log('[DataService] applyCorrections: Successfully applied correction');
      }

      // Clear cache after successful updates
      this.clearCache();
      console.log('[DataService] applyCorrections: All corrections applied successfully');
    } catch (error) {
      console.error('[DataService] applyCorrections: Error applying corrections:', error);
      if (error instanceof Error) {
        console.error('[DataService] applyCorrections: Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
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