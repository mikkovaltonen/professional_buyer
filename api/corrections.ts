import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const baseUrl = 'https://scmbp.com/REST/v1/genaibase/kemppi_Kemppi_100_FG_sales_m_assistant_input_forecasts_separated';
  const query = req.url?.split('?')[1];
  const targetUrl = query ? `${baseUrl}?${query}` : baseUrl;
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  try {
    console.log('Corrections Proxy: Making request to', targetUrl);
    console.log('Corrections Proxy: Method:', req.method);
    console.log('Corrections Proxy: Headers:', req.headers);
    console.log('Corrections Proxy: Body:', req.body);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body:
        req.method !== 'GET' && req.method !== 'HEAD'
          ? req.body
          : undefined
    });

    console.log('Corrections Proxy: Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Corrections Proxy: Response body:', responseText);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (!response.ok) {
      console.error('Corrections Proxy: API error response:', responseText);
      return res.status(response.status).json({
        error: `API responded with status ${response.status}`,
        details: responseText
      });
    }

    // Try to parse as JSON, if it fails return as text
    try {
      const data = JSON.parse(responseText);
      return res.status(200).json(data);
    } catch (parseError) {
      return res.status(200).json({ message: responseText });
    }
    
  } catch (error) {
    console.error('Corrections Proxy: Fetch error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ 
      error: 'Failed to proxy request', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}