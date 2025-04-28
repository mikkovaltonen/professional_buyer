import fs from 'fs';
import path from 'path';

export async function saveCSV(content: string, filePath: string): Promise<void> {
  try {
    // Get the absolute path to the file
    const absolutePath = path.join(process.cwd(), 'public', filePath);
    console.log('Saving CSV to:', absolutePath);

    // Write the content to the file
    fs.writeFileSync(absolutePath, content, 'utf-8');
    console.log('CSV saved successfully');
  } catch (error) {
    console.error('Error saving CSV file:', error);
    throw error;
  }
} 