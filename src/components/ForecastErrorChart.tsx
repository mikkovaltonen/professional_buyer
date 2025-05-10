import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ForecastErrorChartProps {
  data: { date: string; meanAbsError: number; percentBelow20: number }[];
  title: string;
  subtitle?: string;
}

const ForecastErrorChart: React.FC<ForecastErrorChartProps> = ({ data, title, subtitle }) => {
  // Kuukauden/vuoden muotoilu
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fi-FI', { month: 'short', year: 'numeric' });
  };

  // Järjestä data aikajärjestykseen
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="w-full h-[400px]">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {subtitle && (
        <div className="mb-3">
          <div
            className="text-xs text-gray-700 bg-gray-100 rounded p-2 overflow-x-auto"
            style={{maxWidth: '100%', minHeight: '2.5em', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
            {subtitle}
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData} margin={{ top: 5, right: 50, left: 20, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={formatDate} angle={-45} textAnchor="end" height={80} />
          <YAxis yAxisId="left" label={{ value: 'Keskim. abs. virhe (kpl)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: '% alle 20% virhe', angle: 90, position: 'insideRight' }} domain={[0, 100]} />
          <Tooltip formatter={(value: any, name: string) => name === 'percentBelow20' ? `${value.toFixed(1)} %` : value.toFixed(1)} />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="meanAbsError" name="Keskim. abs. virhe (kpl)" stroke="#2563eb" dot={false} strokeWidth={2} />
          <Line yAxisId="right" type="monotone" dataKey="percentBelow20" name="% tuotteista virhe < 20%" stroke="#f59e0b" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForecastErrorChart; 