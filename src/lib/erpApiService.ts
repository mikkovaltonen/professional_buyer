import { storageService, ERPDocument } from './storageService';

export interface SearchCriteria {
  supplierName?: string;        // Toimittajan nimi tai osa nimestä
  productDescription?: string;  // Tuotteen kuvaus tai osa kuvauksesta
  dateFrom?: string;           // Ostopäivämäärä alkaen (YYYY-MM-DD)
  dateTo?: string;             // Ostopäivämäärä päättyen (YYYY-MM-DD)
  buyerName?: string;          // Ostajan nimi tai osa nimestä
}

export interface ERPRecord {
  rowIndex: number;
  [key: string]: any; // Dynamic columns based on Excel headers
}

export interface SearchResult {
  records: ERPRecord[];
  totalCount: number;
  searchCriteria: SearchCriteria;
  executedAt: Date;
  processingTimeMs: number;
}

export class ERPApiService {
  /**
   * Search ERP data with multiple criteria
   */
  async searchRecords(userId: string, criteria: SearchCriteria): Promise<SearchResult> {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 8);
    
    // Log API Request Input
    console.log('📥 ERP API REQUEST [' + requestId + ']:', {
      method: 'searchRecords',
      userId: userId.substring(0, 8) + '...',
      inputParameters: {
        supplierName: criteria.supplierName || null,
        productDescription: criteria.productDescription || null,
        dateFrom: criteria.dateFrom || null,
        dateTo: criteria.dateTo || null,
        buyerName: criteria.buyerName || null
      },
      timestamp: new Date().toISOString(),
      requestId: requestId
    });
    
    try {
      // Get user's ERP document
      const erpDocuments = await storageService.getUserERPDocuments(userId);
      
      if (erpDocuments.length === 0) {
        const result = {
          records: [],
          totalCount: 0,
          searchCriteria: criteria,
          executedAt: new Date(),
          processingTimeMs: Date.now() - startTime
        };
        
        // Log API Response Output (no data)
        console.log('📤 ERP API RESPONSE [' + requestId + ']:', {
          status: 'NO_DATA',
          outputResults: {
            recordCount: result.totalCount,
            records: [],
            searchCriteria: result.searchCriteria
          },
          processingTimeMs: result.processingTimeMs,
          timestamp: new Date().toISOString(),
          requestId: requestId
        });
        
        return result;
      }

      const erpDoc = erpDocuments[0]; // Only one document allowed
      const { rawData, headers } = erpDoc;

      if (!rawData || !headers || rawData.length === 0) {
        const result = {
          records: [],
          totalCount: 0,
          searchCriteria: criteria,
          executedAt: new Date(),
          processingTimeMs: Date.now() - startTime
        };
        
        // Log API Response Output (invalid data)
        console.log('📤 ERP API RESPONSE [' + requestId + ']:', {
          status: 'INVALID_DATA',
          outputResults: {
            recordCount: result.totalCount,
            records: [],
            searchCriteria: result.searchCriteria,
            error: 'No valid data or headers found'
          },
          processingTimeMs: result.processingTimeMs,
          timestamp: new Date().toISOString(),
          requestId: requestId
        });
        
        return result;
      }

      // Convert raw data to records with column names
      const allRecords: ERPRecord[] = rawData.map((row: any[], index: number) => {
        const record: ERPRecord = { rowIndex: index + 2 }; // +2 because row 1 is headers, Excel rows start from 1
        
        headers.forEach((header: string, colIndex: number) => {
          record[header] = row[colIndex] || '';
        });
        
        return record;
      });

      // Apply search filters
      console.log('📋 Before filtering:', {
        totalRecords: allRecords.length,
        availableHeaders: headers,
        sampleRecord: allRecords[0] || null
      });

      const filteredRecords = this.applyFilters(allRecords, criteria, headers, requestId);
      
      const result = {
        records: filteredRecords,
        totalCount: filteredRecords.length,
        searchCriteria: criteria,
        executedAt: new Date(),
        processingTimeMs: Date.now() - startTime
      };
      
      // Log API Response Output (success)
      console.log('📤 ERP API RESPONSE [' + requestId + ']:', {
        status: 'SUCCESS',
        outputResults: {
          recordCount: result.totalCount,
          totalRecordsBeforeFilter: allRecords.length,
          searchCriteria: result.searchCriteria,
          sampleRecords: result.records.slice(0, 3).map(record => {
            const { rowIndex, ...data } = record;
            return { rowIndex, ...data };
          })
        },
        processingTimeMs: result.processingTimeMs,
        timestamp: new Date().toISOString(),
        requestId: requestId
      });

      return result;
    } catch (error) {
      // Log API Response Output (error)
      console.log('📤 ERP API RESPONSE [' + requestId + ']:', {
        status: 'ERROR',
        outputResults: {
          error: error instanceof Error ? error.message : 'Unknown error',
          searchCriteria: criteria
        },
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        requestId: requestId
      });
      
      console.error('❌ ERP API search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply search filters to records
   */
  private applyFilters(records: ERPRecord[], criteria: SearchCriteria, headers: string[], requestId: string): ERPRecord[] {
    let currentRecords = [...records];
    let filterCount = 0;
    
    console.log('🔧 FILTER PROCESSING [' + requestId + ']:', {
      startingRecordCount: currentRecords.length,
      filtersToApply: Object.keys(criteria).filter(key => criteria[key as keyof SearchCriteria])
    });
    
    const filtered = records.filter(record => {
      // Filter by supplier name - exact column match
      if (criteria.supplierName) {
        const supplierField = headers.find(header => 
          header === 'Supplier Name' || header.toLowerCase() === 'supplier name'
        );
        console.log('🏭 SUPPLIER FILTER [' + requestId + ']:', {
          searchField: 'Supplier Name',
          foundField: supplierField,
          searchTerm: criteria.supplierName,
          recordValue: record[supplierField || ''],
          rowIndex: record.rowIndex
        });
        
        if (supplierField) {
          const supplierValue = String(record[supplierField] || '').toLowerCase();
          const searchTerm = criteria.supplierName.toLowerCase();
          if (!supplierValue.includes(searchTerm)) {
            return false;
          }
        } else {
          console.log('⚠️ "Supplier Name" column not found. Available headers:', headers);
        }
      }

      // Filter by product description - exact column match
      if (criteria.productDescription) {
        const productField = headers.find(header => 
          header === 'Description' || header.toLowerCase() === 'description'
        );
        console.log('📦 PRODUCT FILTER [' + requestId + ']:', {
          searchField: 'Description',
          foundField: productField,
          searchTerm: criteria.productDescription,
          recordValue: record[productField || ''],
          rowIndex: record.rowIndex
        });
        
        if (productField) {
          const productValue = String(record[productField] || '').toLowerCase();
          const searchTerm = criteria.productDescription.toLowerCase();
          if (!productValue.includes(searchTerm)) {
            return false;
          }
        } else {
          console.log('⚠️ "Description" column not found. Available headers:', headers);
        }
      }

      // Filter by date range
      if (criteria.dateFrom || criteria.dateTo) {
        // Look specifically for "Receive By" column as the date field
        const dateField = headers.find(header => 
          header === 'Receive By' || header.toLowerCase() === 'receive by'
        );
        
        console.log('📅 DATE FILTER [' + requestId + ']:', {
          searchField: 'Receive By',
          foundField: dateField,
          rawDateValue: record[dateField || ''],
          dateFrom: criteria.dateFrom,
          dateTo: criteria.dateTo,
          rowIndex: record.rowIndex
        });
        
        if (dateField) {
          const rawDateValue = String(record[dateField] || '');
          const dateValue = this.parseDate(rawDateValue);
          
          console.log('📅 Date parsing:', {
            field: dateField,
            rawValue: rawDateValue,
            parsedDate: dateValue,
            isValid: dateValue !== null
          });
          
          if (criteria.dateFrom && dateValue) {
            const fromDate = new Date(criteria.dateFrom);
            const passesFromCheck = dateValue >= fromDate;
            console.log('📅 Date FROM check:', {
              recordDate: dateValue.toISOString(),
              fromCriteria: fromDate.toISOString(),
              passes: passesFromCheck
            });
            if (!passesFromCheck) {
              return false;
            }
          }
          
          if (criteria.dateTo && dateValue) {
            const toDate = new Date(criteria.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of day
            const passesToCheck = dateValue <= toDate;
            console.log('📅 Date TO check:', {
              recordDate: dateValue.toISOString(),
              toCriteria: toDate.toISOString(),
              passes: passesToCheck
            });
            if (!passesToCheck) {
              return false;
            }
          }
        } else {
          console.log('⚠️ "Receive By" column not found for date filtering. Available headers:', headers);
          console.log('💡 Tip: Make sure your Excel has a column named "Receive By" for date filtering to work.');
        }
      }

      // Filter by buyer name - exact column match
      if (criteria.buyerName) {
        const buyerField = headers.find(header => 
          header === 'Buyer Name' || header.toLowerCase() === 'buyer name'
        );
        console.log('👤 BUYER FILTER [' + requestId + ']:', {
          searchField: 'Buyer Name',
          foundField: buyerField,
          searchTerm: criteria.buyerName,
          recordValue: record[buyerField || ''],
          rowIndex: record.rowIndex
        });
        
        if (buyerField) {
          const buyerValue = String(record[buyerField] || '').toLowerCase();
          const searchTerm = criteria.buyerName.toLowerCase();
          if (!buyerValue.includes(searchTerm)) {
            return false;
          }
        } else {
          console.log('⚠️ "Buyer Name" column not found. Available headers:', headers);
        }
      }

      return true;
    });
    
    console.log('✅ FILTER COMPLETE [' + requestId + ']:', {
      originalRecordCount: records.length,
      filteredRecordCount: filtered.length,
      recordsFiltered: records.length - filtered.length,
      filterEfficiency: ((records.length - filtered.length) / records.length * 100).toFixed(1) + '%'
    });
    
    return filtered;
  }


  /**
   * Parse date from various formats
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    console.log('🔍 Parsing date string:', dateStr);
    
    // Try different date formats
    const formats = [
      { regex: /^\d{4}-\d{2}-\d{2}$/, name: 'YYYY-MM-DD' },
      { regex: /^\d{2}\/\d{2}\/\d{4}$/, name: 'MM/DD/YYYY' },
      { regex: /^\d{2}\.\d{2}\.\d{4}$/, name: 'DD.MM.YYYY' },
      { regex: /^\d{1,2}\/\d{1,2}\/\d{4}$/, name: 'M/D/YYYY' },
      { regex: /^\d{1,2}\.\d{1,2}\.\d{4}$/, name: 'D.M.YYYY' }
    ];

    for (const format of formats) {
      if (format.regex.test(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          console.log('✅ Date parsed successfully:', {
            input: dateStr,
            format: format.name,
            output: date.toISOString()
          });
          return date;
        }
      }
    }

    // Try parsing as Excel date serial number
    const num = parseFloat(dateStr);
    if (!isNaN(num) && num > 1 && num < 100000) { // Reasonable range for Excel dates
      // Excel date: days since January 1, 1900 (with leap year bug)
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (num - 2) * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime())) {
        console.log('✅ Excel serial date parsed:', {
          input: dateStr,
          serialNumber: num,
          output: date.toISOString()
        });
        return date;
      }
    }

    console.log('❌ Failed to parse date:', dateStr);
    return null;
  }

  /**
   * Get available fields/columns from ERP data
   */
  async getAvailableFields(userId: string): Promise<string[]> {
    const requestId = Math.random().toString(36).substring(2, 8);
    
    console.log('📥 ERP API REQUEST [' + requestId + ']:', {
      method: 'getAvailableFields',
      userId: userId.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
      requestId: requestId
    });
    
    try {
      const erpDocuments = await storageService.getUserERPDocuments(userId);
      const fields = (erpDocuments.length === 0 || !erpDocuments[0].headers) ? [] : erpDocuments[0].headers;
      
      console.log('📤 ERP API RESPONSE [' + requestId + ']:', {
        status: 'SUCCESS',
        outputResults: {
          availableFields: fields,
          fieldCount: fields.length
        },
        timestamp: new Date().toISOString(),
        requestId: requestId
      });
      
      return fields;
    } catch (error) {
      console.log('📤 ERP API RESPONSE [' + requestId + ']:', {
        status: 'ERROR',
        outputResults: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString(),
        requestId: requestId
      });
      
      console.error('❌ Failed to get available fields:', error);
      return [];
    }
  }

  /**
   * Get sample data for testing
   */
  async getSampleData(userId: string, maxRows: number = 5): Promise<ERPRecord[]> {
    const requestId = Math.random().toString(36).substring(2, 8);
    
    console.log('📥 ERP API REQUEST [' + requestId + ']:', {
      method: 'getSampleData',
      userId: userId.substring(0, 8) + '...',
      inputParameters: {
        maxRows: maxRows
      },
      timestamp: new Date().toISOString(),
      requestId: requestId
    });
    
    try {
      const searchResult = await this.searchRecords(userId, {});
      const sampleData = searchResult.records.slice(0, maxRows);
      
      console.log('📤 ERP API RESPONSE [' + requestId + ']:', {
        status: 'SUCCESS',
        outputResults: {
          sampleRecordCount: sampleData.length,
          totalAvailableRecords: searchResult.totalCount,
          maxRowsRequested: maxRows
        },
        timestamp: new Date().toISOString(),
        requestId: requestId
      });
      
      return sampleData;
    } catch (error) {
      console.log('📤 ERP API RESPONSE [' + requestId + ']:', {
        status: 'ERROR',
        outputResults: {
          error: error instanceof Error ? error.message : 'Unknown error',
          maxRowsRequested: maxRows
        },
        timestamp: new Date().toISOString(),
        requestId: requestId
      });
      
      console.error('❌ Failed to get sample data:', error);
      return [];
    }
  }
}

export const erpApiService = new ERPApiService();