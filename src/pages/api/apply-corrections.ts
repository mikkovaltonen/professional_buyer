import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

interface Correction {
  product_group: string;
  month: string;
  correction_percent: number;
  explanation: string;
}

interface CsvRow {
  'Product Group': string;
  'Year_Month': string;
  [key: string]: string | number | null;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { corrections, filePath } = req.body as { corrections: Correction[]; filePath: string };
    console.log('Received corrections:', corrections);
    console.log('File path:', filePath);

    // Get the absolute path to the CSV file
    const absolutePath = path.join(process.cwd(), filePath);
    console.log('Absolute path:', absolutePath);

    // Read the CSV file
    const csvContent = fs.readFileSync(absolutePath, 'utf-8');
    console.log('Read CSV content');
    
    // Parse CSV
    const results = Papa.parse<CsvRow>(csvContent, {
      header: true,
      delimiter: ';',
      skipEmptyLines: true
    });
    console.log('Parsed CSV data');

    // Create a map of corrections by product group and month
    const correctionsMap = new Map(
      corrections.map(c => [`${c.product_group}|${c.month}`, c])
    );
    console.log('Created corrections map');

    // Update the data with corrections
    const updatedData = results.data.map((row: CsvRow) => {
      const key = `${row['Product Group']}|${row['Year_Month']}`;
      const correction = correctionsMap.get(key);

      if (correction) {
        return {
          ...row,
          correction_percent: correction.correction_percent,
          explanation: correction.explanation
        };
      }
      return row;
    });
    console.log('Updated data with corrections');

    // Convert back to CSV
    const updatedCsv = Papa.unparse(updatedData, {
      delimiter: ';',
      header: true
    });
    console.log('Converted back to CSV');

    // Write back to file
    fs.writeFileSync(absolutePath, updatedCsv);
    console.log('Wrote updated CSV to file');

    res.status(200).json({ message: 'Corrections applied successfully' });
  } catch (error) {
    console.error('Error applying corrections:', error);
    res.status(500).json({ message: 'Failed to apply corrections', error: error instanceof Error ? error.message : 'Unknown error' });
  }
} 