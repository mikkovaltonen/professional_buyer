import fs from 'fs';
import path from 'path';
import { TimeSeriesData } from '@/lib/dataService';

export async function saveJson(jsonData: TimeSeriesData[], filePath: string): Promise<void> {
  try {
    // Ensure the file path is within the public directory
    const fullPath = path.join(process.cwd(), 'public', filePath);
    const publicPath = path.join(process.cwd(), 'public');
    
    if (!fullPath.startsWith(publicPath)) {
      throw new Error('Invalid file path');
    }

    // Ensure the directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(fullPath, JSON.stringify(jsonData, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving JSON:', error);
    throw error;
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { jsonData, filePath } = await req.json();

    if (!jsonData || !filePath) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await saveJson(jsonData, filePath);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving JSON:', error);
    return new Response(JSON.stringify({ error: 'Failed to save JSON file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 