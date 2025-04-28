import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { csvContent, filePath } = req.body;

    if (!csvContent || !filePath) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Ensure the file path is within the public directory
    const fullPath = path.join(process.cwd(), 'public', filePath);
    const publicPath = path.join(process.cwd(), 'public');
    
    if (!fullPath.startsWith(publicPath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Ensure the directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(fullPath, csvContent, 'utf8');

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving CSV:', error);
    return res.status(500).json({ error: 'Failed to save CSV file' });
  }
} 