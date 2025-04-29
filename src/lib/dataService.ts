import Papa from 'papaparse';
import { collection, getDocs, query, where, orderBy, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

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
  id?: string;  // Add id to the interface
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

  private async ensureAuthenticated() {
    if (!auth.currentUser) {
      console.log('No user logged in, attempting to sign in...');
      try {
        await signInWithEmailAndPassword(auth, "forecasting@kemppi.com", "laatua");
        console.log('Successfully signed in');
      } catch (error) {
        console.error('Failed to sign in:', error);
        throw error;
      }
    }
  }

  public async loadCSVData(): Promise<TimeSeriesData[]> {
    console.log('Loading forecast data...');
    if (this.data.length > 0) {
      console.log('Data already loaded, returning cached data');
      return this.data;
    }

    try {
      await this.ensureAuthenticated();

      console.log('Fetching data from Firestore...');
      const salesCollection = collection(db, 'sales_data_with_forecasts');
      const querySnapshot = await getDocs(salesCollection);
      
      if (querySnapshot.empty) {
        console.error('No data found in Firestore');
        throw new Error('No data found in Firestore');
      }

      // Convert Firestore documents to TimeSeriesData format
      this.data = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return normalizeTimeSeriesData({
          ...data,
          id: doc.id // Keep the document ID for future updates
        });
      });

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

  public async applyCorrections(corrections: ForecastCorrection[]): Promise<void> {
    console.log('Starting to apply corrections:', corrections);
    
    try {
      await this.ensureAuthenticated();
      console.log('Authentication successful');

      // Validate corrections
      if (!corrections || corrections.length === 0) {
        throw new Error('No valid corrections provided');
      }

      // 1. Group corrections by product_group and month
      const correctionMap = new Map<string, ForecastCorrection>();
      corrections.forEach(correction => {
        const key = `${correction.product_group}|${correction.month}`;
        correctionMap.set(key, correction);
        console.log(`Mapped correction for key: ${key}`, correction);
      });

      // 2. Update forecast values in Firestore
      const batch = writeBatch(db);
      const salesCollection = collection(db, 'sales_data_with_forecasts');
      let updateCount = 0;
      let skippedCount = 0;

      console.log('Starting to process data rows for updates');
      // Update local data and prepare Firestore updates
      this.data = await Promise.all(this.data.map(async row => {
        const key = `${row["Product Group"]}|${row.Year_Month}`;
        const correction = correctionMap.get(key);

        if (correction && row.forecast_12m && row.id) {
          const currentForecast = row.forecast_12m;
          const correctedForecast = currentForecast * (1 + correction.correction_percent / 100);
          
          console.log(`Updating forecast for ${key}:`, {
            current: currentForecast,
            correction: correction.correction_percent,
            new: correctedForecast
          });

          // Update the document in Firestore with correct field names
          const docRef = doc(db, 'sales_data_with_forecasts', row.id);
          batch.update(docRef, {
            new_forecast_manually_adjusted: correctedForecast,
            old_forecast: row.forecast_12m,
            explanation: correction.explanation,
            correction_percent: correction.correction_percent,
            correction_timestamp: new Date().toISOString()
          });

          updateCount++;
          return {
            ...row,
            forecast_12m: correctedForecast,
            old_forecast: row.forecast_12m,
            explanation: correction.explanation,
            correction_percent: correction.correction_percent
          };
        } else {
          if (correction) {
            console.log(`Skipping update for ${key} - missing forecast or id:`, {
              hasForecast: !!row.forecast_12m,
              hasId: !!row.id
            });
          }
          skippedCount++;
        }
        
        return row;
      }));

      console.log(`Processed ${this.data.length} rows: ${updateCount} updates, ${skippedCount} skipped`);

      if (updateCount === 0) {
        throw new Error('No matching records found for the provided corrections');
      }

      // Commit all updates in a single batch
      console.log('Committing batch update to Firestore...');
      await batch.commit();
      console.log(`Successfully updated ${updateCount} records in Firestore with corrections`);

      // Also update the corrections collection for tracking
      console.log('Recording corrections in tracking collection...');
      const correctionsCollection = collection(db, 'forecast_corrections');
      const batch2 = writeBatch(db);
      
      corrections.forEach(correction => {
        const docRef = doc(correctionsCollection);
        batch2.set(docRef, {
          ...correction,
          timestamp: new Date().toISOString(),
          applied_by: auth.currentUser?.email || 'unknown'
        });
      });

      await batch2.commit();
      console.log('Successfully recorded corrections in tracking collection');

    } catch (error) {
      console.error('Error applying corrections to Firestore:', error);
      throw error;
    }
  }

  public exportCorrectedData(): string {
    return Papa.unparse(this.data);
  }
}

export function normalizeTimeSeriesData(row: any): TimeSeriesData {
  return {
    Year_Month: row.year_month || row.Year_Month,
    "Product Group": row.prodgroup || row["Product Group"],
    "Product code": row.prodcode || row["Product code"],
    "Product description": row.product_description || row["Product description"],
    Quantity: row.qty !== undefined ? row.qty : row.Quantity,
    forecast_12m: row.new_forecast !== undefined ? row.new_forecast : row.forecast_12m,
    old_forecast: row.old_forecast,
    old_forecast_error: row.old_forecast_error,
    correction_percent: row.correction_percent,
    explanation: row.explanation,
    id: row.id // Include the document ID
  };
} 