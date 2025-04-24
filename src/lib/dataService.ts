import Papa from 'papaparse';

export interface TimeSeriesData {
  Year_Month: string;
  "Product Group": string;
  "Product code": string;
  "Product description": string;
  Quantity: string;
  forecast_12m: string;
  old_forecast: string;
  old_forecast_error: string;
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
    console.log('Loading CSV data...');
    if (this.data.length > 0) {
      console.log('Data already loaded, returning cached data');
      return this.data;
    }

    try {
      console.log('Fetching CSV file...');
      const response = await fetch('/demo_data/Demo data with product groups.csv');
      const csvText = await response.text();
      console.log('CSV text loaded, first 500 chars:', csvText.substring(0, 500));
      
      return new Promise((resolve, reject) => {
        Papa.parse<TimeSeriesData>(csvText, {
          header: true,
          delimiter: ";",
          skipEmptyLines: true,
          complete: (results) => {
            console.log('Papa Parse complete, rows:', results.data.length);
            console.log('Sample parsed row:', results.data[0]);
            
            if (results.data.length === 0) {
              console.error('No data found in CSV');
              reject(new Error('No data found in CSV'));
              return;
            }

            this.data = results.data;
            console.log('Final data rows:', this.data.length);
            if (this.data.length > 0) {
              console.log('Sample processed row:', JSON.stringify(this.data[0], null, 2));
            }
            resolve(this.data);
          },
          error: (error) => {
            console.error('Papa Parse error:', error);
            reject(error);
          }
        });
      });
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
} 