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
    this.authToken = import.meta.env.VITE_API_BEARER_TOKEN || '';
    if (!this.authToken) {
      console.error('API Bearer token not found in environment variables');
    }
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

      this.data = rawData.results.map((row: Record<string, unknown>) => normalizeTimeSeriesData(row));
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

  public getProductGroupDetailsInClass(productClass: string): { code: string; description: string }[] {
    if (!productClass || productClass.trim() === '') {
      return [];
    }

    const classSpecificData = this.data.filter(row => row.prod_class === productClass);
    
    if (classSpecificData.length === 0) {
      return [];
    }

    // Using a Map to get unique product groups and use prodgroup itself as description
    const groupMap = new Map<string, string>();
    classSpecificData.forEach(row => {
      if (row.prodgroup && !groupMap.has(row.prodgroup)) {
        // For description, we use the prodgroup value itself as per revised understanding
        groupMap.set(row.prodgroup, row.prodgroup);
      }
    });

    return Array.from(groupMap.entries()).map(([code, description]) => ({ code, description }));
  }

  public getDataForProduct(productCode: string): ForecastDataRow[] {
    return this.data.filter(row => row.prodcode === productCode);
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

  public getUniqueProductCodesInClass(productClass: string): string[] {
    if (!this.data || this.data.length === 0) {
      return [];
    }
    const productCodes = new Set<string>();
    this.data
      .filter(row => row.prod_class === productClass && row.prodcode && typeof row.prodcode === 'string' && row.prodcode.trim() !== '')
      .forEach(row => productCodes.add(row.prodcode!)); // prodcode is now guaranteed to be a valid string
    return Array.from(productCodes);
  }

  public getUniqueProductCodesInGroup(productGroup: string, productClass?: string): string[] {
    if (!this.data || this.data.length === 0) {
      return [];
    }
    let filteredData = this.data.filter(row => 
      row.prodgroup === productGroup && 
      row.prodcode && 
      typeof row.prodcode === 'string' && 
      row.prodcode.trim() !== ''
    );
    
    if (productClass && typeof productClass === 'string' && productClass.trim() !== '') {
      filteredData = filteredData.filter(row => row.prod_class === productClass);
    }
    
    const productCodes = new Set<string>();
    filteredData.forEach(row => productCodes.add(row.prodcode!)); // prodcode is now guaranteed to be a valid string
    return Array.from(productCodes);
  }

  public getProductDetails(productCode: string): TimeSeriesData | undefined {
    if (!this.data || this.data.length === 0 || !productCode) {
      return undefined;
    }
    return this.data.find(row => row.prodcode === productCode);
  }

  public clearCache(): void {
    this.data = [];
  }

  // Helper method to get current data for a specific product and month
  private async getDataForCorrection(productCode: string, month: string): Promise<TimeSeriesData | null> {
    try {
      // Normalize month to match database format
      const normalizedMonth = month.length === 7 ? `${month}-01` : month;
      
      // Check if we have the data in cache first
      const cachedData = this.data.find(d => 
        d.prodcode === productCode && 
        d.Year_Month === normalizedMonth
      );
      
      // Debug: Show all available months for this product
      const availableMonths = this.data
        .filter(d => d.prodcode === productCode)
        .map(d => d.Year_Month)
        .sort();
      console.log(`[DataService] Available months for ${productCode}:`, availableMonths.slice(0, 10)); // Show first 10
      
      if (cachedData) {
        console.log('[DataService] Found cached data for correction calculation:', cachedData);
        console.log('[DataService] All available numeric fields:', {
          Quantity: cachedData.Quantity,
          new_forecast: cachedData.new_forecast,
          old_forecast: cachedData.old_forecast,
          new_forecast_manually_adjusted: cachedData.new_forecast_manually_adjusted,
          old_forecast_error: cachedData.old_forecast_error,
          correction_percent: cachedData.correction_percent
        });
        return cachedData;
      }
      
      // If exact month not found, try to use the latest available data for calculation
      if (availableMonths.length > 0) {
        const latestMonth = availableMonths[availableMonths.length - 1];
        const latestData = this.data.find(d => 
          d.prodcode === productCode && 
          d.Year_Month === latestMonth
        );
        if (latestData) {
          console.log(`[DataService] Using latest available data (${latestMonth}) for calculation:`, {
            targetMonth: normalizedMonth,
            usedMonth: latestMonth,
            new_forecast: latestData.new_forecast,
            old_forecast: latestData.old_forecast,
            Quantity: latestData.Quantity
          });
          return latestData;
        }
      }
      
      // If not in cache, fetch from API
      console.log('[DataService] Fetching data for correction calculation...');
      const queryParams = new URLSearchParams();
      queryParams.append('where[prodcode]', productCode);
      queryParams.append('where[Year_Month]', normalizedMonth);
      
      const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const apiResponse = await response.json();
        
        // Handle both array and object responses (like debug function)
        let records: any[] = [];
        if (Array.isArray(apiResponse)) {
          records = apiResponse;
        } else if (apiResponse && Array.isArray(apiResponse.results)) {
          records = apiResponse.results;
        }
        
        if (records && records.length > 0) {
          const normalizedData = normalizeTimeSeriesData(records[0]);
          console.log('[DataService] Fetched data for correction calculation:', normalizedData);
          return normalizedData;
        }
      }
      
      console.log('[DataService] No data found for correction calculation');
      return null;
    } catch (error) {
      console.error('[DataService] Error fetching data for correction:', error);
      return null;
    }
  }

  // Manual GET to investigate data for MTP23X
  public async debugGetMTP23XData(): Promise<void> {
    console.log('[DataService] debugGetMTP23XData: Starting manual investigation...');
    
    try {
      // 1. Check all MTP23X data in cache
      const allMTP23XData = this.data.filter(d => d.prodcode === 'MTP23X');
      console.log(`[DataService] Found ${allMTP23XData.length} MTP23X records in cache`);
      
      if (allMTP23XData.length > 0) {
        console.log('[DataService] Sample MTP23X records:', allMTP23XData.slice(0, 3));
        console.log('[DataService] All MTP23X months:', allMTP23XData.map(d => d.Year_Month).sort());
      }
      
      // 2. Try direct API call for MTP23X
      console.log('[DataService] Making direct API call for MTP23X...');
      const queryParams = new URLSearchParams();
      queryParams.append('where[prodcode]', 'MTP23X');
      
      const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const apiData = await response.json();
        console.log('[DataService] Raw API response:', apiData);
        console.log('[DataService] API response type:', typeof apiData);
        
        // Handle both array and object responses
        let records: any[] = [];
        if (Array.isArray(apiData)) {
          records = apiData;
        } else if (apiData && Array.isArray(apiData.results)) {
          records = apiData.results;
          console.log('[DataService] API response format: wrapped in results object');
        }
        
        console.log(`[DataService] Found ${records.length} MTP23X records`);
        if (records.length > 0) {
          console.log('[DataService] Sample MTP23X data:', records.slice(0, 3));
          
          // Check specifically for 2025-08
          const aug2025 = records.find((d: any) => d.Year_Month === '2025-08-01');
          if (aug2025) {
            console.log('[DataService] Found 2025-08-01 data:', aug2025);
          } else {
            console.log('[DataService] No 2025-08-01 data found. Available months:', 
              [...new Set(records.map((d: any) => d.Year_Month))].sort().slice(0, 10));
          }
          
          // Check what forecast fields have values
          const sampleRecord = records[0];
          console.log('[DataService] Sample record fields:', {
            Year_Month: sampleRecord.Year_Month,
            prodcode: sampleRecord.prodcode,
            new_forecast: sampleRecord.new_forecast,
            old_forecast: sampleRecord.old_forecast,
            Quantity: sampleRecord.Quantity,
            new_forecast_manually_adjusted: sampleRecord.new_forecast_manually_adjusted
          });
        } else {
          console.log('[DataService] No MTP23X records found');
        }
      } else {
        console.error('[DataService] API call failed:', response.status, response.statusText);
      }
      
      // 3. Check product group data instead
      console.log('[DataService] Checking product group 20211 MASTERTIG PANELS...');
      const groupData = this.data.filter(d => d.prodgroup === '20211 MASTERTIG PANELS');
      console.log(`[DataService] Found ${groupData.length} records for product group 20211`);
      
      if (groupData.length > 0) {
        console.log('[DataService] Sample group data:', groupData.slice(0, 3));
        console.log('[DataService] Product codes in group:', [...new Set(groupData.map(d => d.prodcode))].slice(0, 10));
        console.log('[DataService] Available months for group:', [...new Set(groupData.map(d => d.Year_Month))].sort().slice(0, 10));
      }
      
    } catch (error) {
      console.error('[DataService] debugGetMTP23XData failed:', error);
    }
  }

  // Test function for debugging API calls
  public async testApiCall(testData?: Partial<ForecastCorrection>): Promise<void> {
    const defaultTestData: ForecastCorrection = {
      prod_class: "1000 Lopputuotteet",
      product_group: "24820 PLASMA CUTT. CONSUMABLES", 
      product_code: "HY420168",
      month: "2025-08",
      correction_percent: -2,
      explanation: "Test API call - calculating adjusted forecast",
      forecast_corrector: "test@system.com"
    };

    const data = { ...defaultTestData, ...testData };
    console.log('[DataService] testApiCall: Testing with data:', data);
    
    try {
      await this.applyCorrections([data]);
      console.log('[DataService] testApiCall: SUCCESS');
    } catch (error) {
      console.error('[DataService] testApiCall: FAILED:', error);
    }
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
        
        // First, get the current forecast data to calculate adjusted forecast
        const currentData = await this.getDataForCorrection(correction.product_code, correction.month);
        
        // Normalize month to include day for the API
        const normalizedMonth = correction.month.length === 7 ? `${correction.month}-01` : correction.month;

        // Build URL with query parameters using correct column names
        const queryParams = new URLSearchParams();
        queryParams.append('where[prodcode]', correction.product_code);
        queryParams.append('where[Year_Month]', normalizedMonth);
        
        const apiUrl = `${this.baseUrl}?${queryParams.toString()}`;
        
        // Calculate adjusted forecast - try multiple forecast fields
        let adjustedForecast: number | null = null;
        let originalForecast: number | null = null;
        
        if (currentData) {
          // Try different forecast fields in order of preference
          originalForecast = currentData.new_forecast || currentData.old_forecast || currentData.Quantity;
          let usedField = 'none';
          
          if (currentData.new_forecast !== null && currentData.new_forecast > 0) {
            originalForecast = currentData.new_forecast;
            usedField = 'new_forecast';
          } else if (currentData.old_forecast !== null && currentData.old_forecast > 0) {
            originalForecast = currentData.old_forecast;
            usedField = 'old_forecast';
          } else if (currentData.Quantity !== null && currentData.Quantity > 0) {
            originalForecast = currentData.Quantity;
            usedField = 'Quantity';
          }
          
          if (originalForecast !== null && originalForecast > 0) {
            adjustedForecast = originalForecast * (1 + correction.correction_percent / 100);
            console.log('[DataService] Calculated adjusted forecast:', {
              original: originalForecast,
              correctionPercent: correction.correction_percent,
              adjusted: adjustedForecast,
              usedField: usedField
            });
          } else {
            // Use default value of 100 for calculation when no data available
            const defaultValue = 100;
            adjustedForecast = defaultValue * (1 + correction.correction_percent / 100);
            console.log('[DataService] Using default value for calculation (no data available):', {
              defaultValue: defaultValue,
              correctionPercent: correction.correction_percent,
              adjusted: adjustedForecast,
              note: 'All forecast fields were null'
            });
          }
        }
        
        // Prepare form data for body (enhanced with calculated values)
        const formData = new URLSearchParams();
        
        // CRITICAL: Only update correction fields, never touch new_forecast
        console.log('[DataService] PROTECTION: Only updating correction fields, preserving original forecast data');
        
        // Core correction data
        formData.append('correction_percent', correction.correction_percent.toString());
        
        // Add calculated adjusted forecast
        if (adjustedForecast !== null) {
          formData.append('new_forecast_manually_adjusted', adjustedForecast.toString());
        }
        
        // EXPLICIT PROTECTION: Ensure we don't accidentally overwrite new_forecast
        // The API should not modify new_forecast field during correction updates
        
        // Skip explanation and timestamp for now - database schema issues
        console.log('[DataService] Skipping explanation and timestamp due to database schema constraints');

        console.log('[DataService] applyCorrections: API URL:', apiUrl);
        console.log('[DataService] applyCorrections: Sending form data:', Object.fromEntries(formData));
        console.log('[DataService] applyCorrections: Full request details:', {
          url: apiUrl,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString(),
          WARNING: 'THIS REQUEST SHOULD ONLY UPDATE CORRECTION FIELDS, NEVER new_forecast'
        });

        // Send the request to the REST API using form encoding as per cURL example
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
        });

        if (!response.ok) {
          let errorData: unknown;
          const contentType = response.headers.get('content-type');
          
          try {
            if (contentType?.includes('application/json')) {
              errorData = await response.json();
            } else {
              errorData = await response.text();
            }
          } catch (parseError) {
            errorData = `Failed to parse error response: ${parseError}`;
          }
          
          console.error('[DataService] applyCorrections: Full error details:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: errorData
          });
          
          throw new Error(`API Error ${response.status}: ${JSON.stringify(errorData)}`);
        }

        console.log('[DataService] applyCorrections: Successfully applied correction');
        
        // Debug: Verify what was actually saved
        try {
          const verifyResponse = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
              'Accept': 'application/json'
            }
          });
          
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            const savedData = verifyData.results?.[0];
            console.log('[DataService] VERIFICATION - Data after save:', {
              new_forecast: savedData?.new_forecast,
              new_forecast_manually_adjusted: savedData?.new_forecast_manually_adjusted,
              correction_percent: savedData?.correction_percent,
              month: correction.month
            });
          }
        } catch (verifyError) {
          console.warn('[DataService] Could not verify saved data:', verifyError);
        }
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

// Global debug functions for console testing
if (typeof window !== 'undefined') {
  (window as any).debugApiCall = async (testData?: any) => {
    const dataService = new DataService();
    await dataService.testApiCall(testData);
  };
  
  (window as any).debugMTP23X = async () => {
    const dataService = new DataService();
    await dataService.debugGetMTP23XData();
  };
}

export function normalizeTimeSeriesData(row: Record<string, unknown>): TimeSeriesData {
  return {
    Year_Month: row.Year_Month as string,
    prod_class: row.prod_class as string,
    prodgroup: row.prodgroup as string,
    prodcode: row.prodcode as string,
    proddesc1: row.proddesc1 as string,
    Quantity: row.Quantity as number | null,
    new_forecast: row.new_forecast as number | null,
    old_forecast: row.old_forecast as number | null,
    old_forecast_error: row.old_forecast_error as number | null,
    correction_percent: row.correction_percent as number | null,
    explanation: row.explanation as string | null,
    new_forecast_manually_adjusted: row.new_forecast_manually_adjusted as number | null,
    correction_timestamp: row.correction_timestamp as string | null
  };
} 