import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const targetUrl = 'https://scmbp.com/REST/v1/genaibase/kemppi_Kemppi_100_FG_sales_m_assistant_input_forecasts_separated';
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  try {
    console.log('Proxy: Making request to', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('Proxy: Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Proxy: API error response:', errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Proxy: Successfully fetched data');

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    // Set CORS headers even for error responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return res.status(500).json({ 
      error: 'Failed to fetch data from API',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 