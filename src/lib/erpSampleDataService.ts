/**
 * Service for accessing static ERP sample data
 * This provides a fixed dataset for all users for consistent testing
 */

export interface ERPSampleRecord {
  rowIndex: number;
  'PO Number': number;
  'Supplier Name': string;
  'Supplier Address': string;
  'Supplier VAT No.': string;
  'Product Code': string;
  'Description': string;
  'Quantity': number;
  'Unit': string;
  'Unit Price': number;
  'VAT %': number;
  'Line Amount': number;
  'Buyer Name': string;
  'Buyer Phone': string;
  'Buyer Email': string;
  'Receive By': string;
  'Prices Including VAT': string;
  'Vendor Invoice No.': number;
  'Vendor Order No.': number;
  'Giro No.': string;
  'VAT Registration No.': string;
}

export class ERPSampleDataService {
  private static instance: ERPSampleDataService;
  private sampleData: ERPSampleRecord[] | null = null;
  private headers: string[] = [
    'PO Number', 'Supplier Name', 'Supplier Address', 'Supplier VAT No.',
    'Product Code', 'Description', 'Quantity', 'Unit', 'Unit Price',
    'VAT %', 'Line Amount', 'Buyer Name', 'Buyer Phone', 'Buyer Email',
    'Receive By', 'Prices Including VAT', 'Vendor Invoice No.',
    'Vendor Order No.', 'Giro No.', 'VAT Registration No.'
  ];

  private constructor() {}

  static getInstance(): ERPSampleDataService {
    if (!ERPSampleDataService.instance) {
      ERPSampleDataService.instance = new ERPSampleDataService();
    }
    return ERPSampleDataService.instance;
  }

  /**
   * Load sample data from JSON file
   */
  async loadSampleData(): Promise<void> {
    if (this.sampleData) {
      return; // Already loaded
    }

    try {
      const response = await fetch('/sample_purchase_orders.json');
      if (!response.ok) {
        throw new Error(`Failed to load sample data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add rowIndex to each record
      this.sampleData = data.map((record: any, index: number) => ({
        ...record,
        rowIndex: index + 1
      }));
      
      console.log(`✅ Loaded ${this.sampleData.length} sample ERP records`);
    } catch (error) {
      console.error('❌ Error loading sample ERP data:', error);
      throw error;
    }
  }

  /**
   * Get all sample data
   */
  async getSampleData(): Promise<{
    records: ERPSampleRecord[];
    headers: string[];
  }> {
    await this.loadSampleData();
    return {
      records: this.sampleData || [],
      headers: this.headers
    };
  }

  /**
   * Get headers for the sample data
   */
  getHeaders(): string[] {
    return this.headers;
  }
}

export const erpSampleDataService = ERPSampleDataService.getInstance();