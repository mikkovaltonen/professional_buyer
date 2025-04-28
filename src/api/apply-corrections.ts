import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

interface CsvRow {
  Year_Month: string;
  'Product Group': string;
  'Product code': string;
  'Product description': string;
  Quantity: string;
  forecast_12m: string;
  old_forecast: string;
  old_forecast_error: string;
  correction_percent?: string;
  explanation?: string;
}

interface Correction {
  product_group: string;
  month: string;
  correction_percent: number;
  explanation: string;
}

export async function applyCorrections(corrections: Correction[]): Promise<void> {
  try {
    // Get the absolute path to the CSV file
    const csvPath = path.resolve('./public/demo_data/Demo data with product groups.csv');
    
    // Read the CSV file directly
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const results = Papa.parse<CsvRow>(csvContent, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true
    });

    // Create a map of corrections by product group and month
    const correctionsMap = new Map(
      corrections.map(c => [`${c.product_group}|${c.month}`, c])
    );

    // Update the data with corrections
    const updatedData = results.data.map(row => {
      const key = `${row['Product Group']}|${row.Year_Month}`;
      const correction = correctionsMap.get(key);

      if (correction) {
        return {
          ...row,
          correction_percent: correction.correction_percent.toString(),
          explanation: correction.explanation
        };
      }
      return row;
    });

    // Convert back to CSV
    const updatedCsv = Papa.unparse(updatedData, {
      delimiter: ';',
      header: true
    });

    // Write directly to file
    fs.writeFileSync(csvPath, updatedCsv, 'utf-8');
    
  } catch (error) {
    console.error('Error applying corrections:', error);
    throw error;
  }
} 