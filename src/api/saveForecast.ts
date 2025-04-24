import fs from 'fs';
import path from 'path';

interface ForecastAdjustment {
  product_group: string;
  month: string;
  correction_percent: number;
}

interface SaveForecastRequest {
  adjustments: ForecastAdjustment[];
  timestamp: string;
}

export const saveForecast = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const data: SaveForecastRequest = await req.json();
    const filePath = path.join(process.cwd(), 'public', 'forecast_adjustments.json');
    
    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Create file if it doesn't exist
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ adjustments: [] }, null, 2));
    }

    // Read existing data
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const existingData = JSON.parse(fileContent);

    // Add new adjustments with timestamp
    existingData.adjustments = existingData.adjustments || [];
    existingData.adjustments.push({
      ...data,
      timestamp: new Date().toISOString()
    });

    // Write updated data back to file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error saving forecast:', error);
    return new Response(JSON.stringify({ error: 'Failed to save forecast' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 