import { collection, getDocs, query, where, orderBy, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export interface TimeSeriesData {
  Year_Month: string;
  "Product Group": string;
  "Product code": string;
  "Product description": string;
  prod_class: string;
  Quantity: number | null;
  new_forecast: number | null;
  old_forecast: number | null;
  old_forecast_error: string | null;
  correction_percent?: number | null;
  explanation?: string | null;
  new_forecast_manually_adjusted: number | null;
  correction_timestamp?: string | null;
  id?: string;
  forecast_corrector?: string;
  last_manual_correction_date?: string | null;
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
  public data: TimeSeriesData[] = [];

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

  public async loadForecastData(): Promise<TimeSeriesData[]> {
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

  public getUniqueProductClasses(): string[] {
    const classes = [...new Set(this.data.map(row => row["prod_class"]))];
    console.log('Found product classes:', classes);
    return classes;
  }

  public getProductGroupsInClass(productClass: string): string[] {
    const groups = [...new Set(
      this.data
        .filter(row => row["prod_class"] === productClass)
        .map(row => row["Product Group"])
    )];
    console.log('Found product groups for class:', productClass, groups);
    return groups;
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
        "Product Group": productGroup,
        "Product code": "GROUP_TOTAL",
        "Product description": `${productGroup} Total`,
        prod_class: rowsForDate[0]?.["prod_class"] || "",
        Quantity: hasQuantity ? totalQuantity : null,
        new_forecast: hasNewForecast ? totalNewForecast : null,
        new_forecast_manually_adjusted: hasNewForecastAdjusted ? totalNewForecastAdjusted : null,
        old_forecast: hasOldForecast ? totalOldForecast : null,
        old_forecast_error: null,
        correction_percent: latestAdjustment?.correction_percent || null,
        explanation: latestAdjustment?.explanation || null,
        correction_timestamp: latestAdjustment?.correction_timestamp || null,
        last_manual_correction_date: null
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
      if (this.data.length === 0) {
        console.log('No data loaded, loading data first...');
        await this.loadForecastData();
      }
      console.log('Data loaded, rows:', this.data.length);
      console.log('Current auth state:', auth.currentUser ? 'Logged in' : 'Not logged in');
      await this.ensureAuthenticated();
      console.log('Authentication successful, user:', auth.currentUser?.email);
      if (!corrections || corrections.length === 0) {
        throw new Error('No valid corrections provided');
      }
      const normalizeString = (str: string) => str.replace(/\s+/g, ' ').trim();
      // Expand prod_class-only corrections to all products in that class
      let expandedCorrections: ForecastCorrection[] = [];
      for (const correction of corrections) {
        if (correction.prod_class && !correction.product_group && !correction.product_code) {
          // Find all products in this class for the given month
          const matchingRows = this.data.filter(row => row.prod_class === correction.prod_class && row.Year_Month === correction.month);
          for (const row of matchingRows) {
            expandedCorrections.push({
              ...correction,
              product_group: row["Product Group"],
              product_code: row["Product code"],
            });
          }
        } else {
          expandedCorrections.push(correction);
        }
      }
      // 1. Group corrections by product_group/product_code and month
      const correctionMap = new Map<string, ForecastCorrection>();
      expandedCorrections.forEach(correction => {
        const identifier = correction.product_group ? 
          `group:${normalizeString(correction.product_group)}` : 
          correction.product_code ? `product:${correction.product_code}` : '';
        const key = `${identifier}|${correction.month}`;
        correctionMap.set(key, correction);
        console.log(`Mapped correction for key: ${key}`, correction);
      });
      // 2. Update forecast values in Firestore
      const batch = writeBatch(db);
      const salesCollection = collection(db, 'sales_data_with_forecasts');
      let updateCount = 0;
      let skippedCount = 0;
      console.log('Starting to process data rows for updates');
      for (const row of this.data) {
        let key: string | undefined;
        for (const [correctionKey, correction] of correctionMap.entries()) {
          if (correction.product_group && 
              normalizeString(row["Product Group"]) === normalizeString(correction.product_group) && 
              row.Year_Month === correction.month) {
            key = correctionKey;
            break;
          } else if (correction.product_code && 
                    row["Product code"] === correction.product_code && 
                    row.Year_Month === correction.month) {
            key = correctionKey;
            break;
          }
        }
        if (skippedCount % 100 === 0) {
          console.log('Processing row:', {
            key,
            productGroup: row["Product Group"],
            productCode: row["Product code"],
            yearMonth: row.Year_Month,
            hasCorrection: !!key,
            availableKeys: Array.from(correctionMap.keys()).join(', ')
          });
        }
        const correction = key ? correctionMap.get(key) : undefined;
        if (correction && row.id) {
          if (row.new_forecast !== null) {
            const correctedForecast = row.new_forecast * (1 + correction.correction_percent / 100);
            console.log(`Preparing update for document ${row.id}:`, {
              key,
              originalForecast: row.new_forecast,
              correction: correction.correction_percent,
              newForecast: correctedForecast
            });
            try {
              const docRef = doc(db, 'sales_data_with_forecasts', row.id);
              batch.update(docRef, {
                new_forecast_manually_adjusted: correctedForecast,
                explanation: correction.explanation,
                correction_percent: correction.correction_percent,
                correction_timestamp: new Date().toISOString(),
                forecast_corrector: correction.forecast_corrector || "forecasting@kemppi.com",
                last_manual_correction_date: new Date().toISOString()
              });
              console.log(`Added document ${row.id} to batch`);
              row.new_forecast_manually_adjusted = correctedForecast;
              row.explanation = correction.explanation;
              row.correction_percent = correction.correction_percent;
              row.correction_timestamp = new Date().toISOString();
              row.forecast_corrector = correction.forecast_corrector || "forecasting@kemppi.com";
              row.last_manual_correction_date = new Date().toISOString();
              updateCount++;
            } catch (updateError) {
              console.error(`Error preparing update for document ${row.id}:`, updateError);
              throw updateError;
            }
          } else {
            console.log(`Skipping update for ${key}: No forecast value available`);
            skippedCount++;
          }
        }
        if (correction) {
          console.log(`Skipping update for ${key}:`, {
            hasId: !!row.id,
            forecast: row.new_forecast_manually_adjusted,
            newForecast: row.new_forecast,
            id: row.id
          });
        }
        skippedCount++;
      }
      console.log(`Processed ${this.data.length} rows: ${updateCount} updates, ${skippedCount} skipped`);
      if (updateCount === 0) {
        throw new Error('No matching records found for the provided corrections');
      }
      console.log('Committing batch update to Firestore...');
      await batch.commit();
      console.log(`Successfully updated ${updateCount} records in Firestore with corrections`);
    } catch (error) {
      console.error('Error applying corrections to Firestore:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  public exportCorrectedData(): string {
    return Papa.unparse(this.data);
  }

  public getAllData(): TimeSeriesData[] {
    return this.data;
  }

  public getDataByClass(productClass: string): TimeSeriesData[] {
    return this.data.filter(row => row.prod_class === productClass);
  }
}

export function normalizeTimeSeriesData(row: any): TimeSeriesData {
  return {
    Year_Month: row.year_month || row.Year_Month,
    "Product Group": row.prodgroup || row["Product Group"],
    "Product code": row.prodcode || row["Product code"],
    "Product description": row.product_description || row["Product description"],
    prod_class: row.prod_class || row["prod_class"] || "",
    Quantity: row.qty !== undefined ? row.qty : row.Quantity,
    new_forecast: row.new_forecast,
    old_forecast: row.old_forecast,
    old_forecast_error: row.old_forecast_error,
    correction_percent: row.correction_percent,
    explanation: row.explanation,
    new_forecast_manually_adjusted: row.new_forecast_manually_adjusted,
    correction_timestamp: row.correction_timestamp,
    id: row.id, // Include the document ID
    forecast_corrector: row.forecast_corrector,
    last_manual_correction_date: row.last_manual_correction_date
  };
} 