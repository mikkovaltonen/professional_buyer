import Papa from 'papaparse';

export interface TimeSeriesData {
  Year_Month: string;
  "Product Group": string;
  "Product code": string;
  "Product description": string;
  Quantity: number | null;
  forecast_12m: number | null;
  old_forecast: number | null;
  old_forecast_error: string | null;
  correction_percent?: number | null;
  explanation?: string | null;
}

export interface ForecastCorrection {
  product_group: string;
  month: string;
  correction_percent: number;
  explanation: string;
}

export class DataService {
  private static instance: DataService;
  private data: TimeSeriesData[] = [];

  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  public async loadCSVData(): Promise<TimeSeriesData[]> {
    console.log('Loading forecast data...');
    if (this.data.length > 0) {
      console.log('Data already loaded, returning cached data');
      return this.data;
    }

    try {
      console.log('Fetching JSON file...');
      const response = await fetch('/demo_data/sales_data_with_forecasts.json');
      const jsonData = await response.json();
      console.log('JSON data loaded, rows:', jsonData.length);
      
      if (jsonData.length === 0) {
        console.error('No data found in JSON');
        throw new Error('No data found in JSON');
      }

      // Normalize all rows to TimeSeriesData
      this.data = jsonData.map(normalizeTimeSeriesData);
      console.log('Final data rows:', this.data.length);
      if (this.data.length > 0) {
        console.log('Sample processed row:', JSON.stringify(this.data[0], null, 2));
      }
      return this.data;
    } catch (error) {
      console.error('Failed to load data:', error);
      throw error;
    }
  }

  public getUniqueProductGroups(): string[] {
    const groups = [...new Set(this.data.map(row => row["Product Group"]))];
    console.log('Found product groups:', groups);
    return groups;
  }

  public getProductsInGroup(productGroup: string): {code: string, description: string}[] {
    console.log('Getting products for group:', productGroup);
    const productsMap = new Map<string, {code: string, description: string}>();
    
    this.data
      .filter(row => row["Product Group"] === productGroup)
      .forEach(row => {
        const product = {
          code: row["Product code"],
          description: row["Product description"]
        };
        productsMap.set(row["Product code"], product);
      });
    
    const products = Array.from(productsMap.values());
    console.log('Found products:', products);
    return products;
  }

  public getProductData(productCode: string): TimeSeriesData[] {
    console.log('Getting data for product:', productCode);
    
    // Filter data for the specific product code
    const data = this.data.filter(row => row["Product code"] === productCode);

    // Sort by date
    const sortedData = data.sort((a, b) => 
      new Date(a.Year_Month).getTime() - new Date(b.Year_Month).getTime()
    );

    console.log(`Found ${sortedData.length} rows for product ${productCode}`);
    if (sortedData.length > 0) {
      console.log('First row:', sortedData[0]);
      console.log('Last row:', sortedData[sortedData.length - 1]);
    }

    return sortedData;
  }

  public getProductGroupData(productGroup: string): TimeSeriesData[] {
    console.log('Getting aggregated data for product group:', productGroup);
    
    // Filter data for the specific product group
    const groupData = this.data.filter(row => row["Product Group"] === productGroup);
    
    // Get unique dates
    const dates = [...new Set(groupData.map(row => row.Year_Month))];
    
    // Create aggregated data by summing quantities for each date
    const aggregatedData = dates.map(date => {
      const rowsForDate = groupData.filter(row => row.Year_Month === date);
      
      // Only sum non-empty values
      const totalQuantity = rowsForDate
        .filter(row => row.Quantity !== null)
        .reduce((sum, row) => sum + (row.Quantity || 0), 0);

      const totalForecast = rowsForDate
        .filter(row => row.forecast_12m !== null)
        .reduce((sum, row) => sum + (row.forecast_12m || 0), 0);

      const totalOldForecast = rowsForDate
        .filter(row => row.old_forecast !== null)
        .reduce((sum, row) => sum + (row.old_forecast || 0), 0);

      // If all values for a metric are empty, return null
      const hasQuantity = rowsForDate.some(row => row.Quantity !== null);
      const hasForecast = rowsForDate.some(row => row.forecast_12m !== null);
      const hasOldForecast = rowsForDate.some(row => row.old_forecast !== null);
      
      return {
        Year_Month: date,
        "Product Group": productGroup,
        "Product code": "GROUP_TOTAL",
        "Product description": `${productGroup} Total`,
        Quantity: hasQuantity ? totalQuantity : null,
        forecast_12m: hasForecast ? totalForecast : null,
        old_forecast: hasOldForecast ? totalOldForecast : null,
        old_forecast_error: null,
        correction_percent: null,
        explanation: null
      };
    });

    // Sort by date
    const sortedData = aggregatedData.sort((a, b) => 
      new Date(a.Year_Month).getTime() - new Date(b.Year_Month).getTime()
    );

    console.log(`Generated ${sortedData.length} aggregated data points for group ${productGroup}`);
    if (sortedData.length > 0) {
      console.log('First aggregated row:', sortedData[0]);
      console.log('Last aggregated row:', sortedData[sortedData.length - 1]);
    }

    return sortedData;
  }

  public applyCorrections(corrections: ForecastCorrection[]): void {
    console.log('Applying corrections:', corrections);
    
    // 1. Group corrections by product_group and month
    const correctionMap = new Map<string, ForecastCorrection>();
    corrections.forEach(correction => {
      const key = `${correction.product_group}|${correction.month}`;
      correctionMap.set(key, correction);
    });

    // 2. Update forecast values in CSV data
    this.data = this.data.map(row => {
      const key = `${row["Product Group"]}|${row.Year_Month}`;
      const correction = correctionMap.get(key);

      if (correction && row.forecast_12m) {
        const currentForecast = row.forecast_12m;
        const correctedForecast = currentForecast * (1 + correction.correction_percent / 100);
        
        return {
          ...row,
          forecast_12m: correctedForecast,
          old_forecast: row.forecast_12m, // Store original forecast
          old_forecast_error: correction.explanation
        };
      }
      
      return row;
    });

    console.log('Corrections applied successfully');
  }

  public exportCorrectedData(): string {
    console.log('Exporting corrected data...');
    return Papa.unparse(this.data, {
      delimiter: ";",
      header: true
    });
  }
}

// Normalization function: maps any incoming data format to TimeSeriesData
export function normalizeTimeSeriesData(row: any): TimeSeriesData {
  return {
    Year_Month: row.Year_Month || row.year_month || '',
    "Product Group": row["Product Group"] || row.prodgroup || '',
    "Product code": row["Product code"] || row.prodcode || '',
    "Product description": row["Product description"] || row.product_description || '',
    Quantity: row.Quantity ?? row.qty ?? null,
    forecast_12m: row.forecast_12m ?? row.new_forecast ?? null,
    old_forecast: row.old_forecast ?? null,
    old_forecast_error: row.old_forecast_error ?? null,
    correction_percent: row.correction_percent ?? null,
    explanation: row.explanation ?? null
  };
} 