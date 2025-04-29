export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Otetaan vastaan data, mutta ei tallenneta pysyvästi
  const data = req.body;
  // Voit logittaa datan testauksen vuoksi
  console.log('Received forecast update (demo, not persisted):', data);

  // Palautetaan onnistumisviesti
  res.status(200).json({ message: 'Data received (not persisted, demo only)' });
} 