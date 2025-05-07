import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TimeChartProps {
  data: {
    date: string;
    value: number | null;
    old_forecast?: number | null;
    old_forecast_error?: number | null;
    new_forecast?: number | null;
    new_forecast_manually_adjusted?: number | null;
    explanation?: string;
  }[];
  title: string;
  subtitle?: string;
  showForecastErrorLine?: boolean;
}

const TimeChart: React.FC<TimeChartProps> = ({ data, title, subtitle, showForecastErrorLine = true }) => {
  // Format date to show only month and year in Finnish
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fi-FI', { month: 'short', year: 'numeric' });
  };

  // Custom tooltip content with Finnish number formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Create a mapping for translating the names
      const nameTranslations: { [key: string]: string } = {
        'value': 'Toteutunut kysyntä',
        'new_forecast': 'Tilastollinen ennuste',
        'new_forecast_manually_adjusted': 'Korjattu ennuste',
        'old_forecast': 'Vanha ennuste',
        'old_forecast_error': 'Ennustevirhe'
      };

      // Find the data point for this date to get the explanation
      const dataPoint = data.find(d => d.date === label);

      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-semibold">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            entry.value !== null && (
              <p key={index} style={{ color: entry.color }}>
                {nameTranslations[entry.name] || entry.name}: {entry.value.toLocaleString('fi-FI', { maximumFractionDigits: 0 })}
              </p>
            )
          ))}
          {dataPoint?.explanation && (
            <p className="mt-2 text-sm text-gray-600 border-t pt-2">
              Selitys: {dataPoint.explanation}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px]">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {subtitle && (
        <div className="mb-3">
          <div
            className="text-xs text-gray-700 bg-gray-100 rounded p-2 overflow-x-auto"
            style={{maxWidth: '100%', minHeight: '2.5em', whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}
          >
            {subtitle}
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 50,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            interval="preserveStartEnd"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name="Toteutunut kysyntä"
            stroke="#4338ca"
            dot={false}
            strokeWidth={2}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="old_forecast"
            name="Vanha ennuste"
            stroke="#10b981"
            dot={false}
            strokeWidth={2}
            strokeDasharray="3 3"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="new_forecast"
            name="Tilastollinen ennuste"
            stroke="#f59e0b"
            dot={false}
            strokeWidth={2}
            strokeDasharray="5 5"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="new_forecast_manually_adjusted"
            name="Korjattu ennuste"
            stroke="#dc2626"
            dot={false}
            strokeWidth={2}
            connectNulls={false}
          />
          {showForecastErrorLine && (
            <Line
              type="monotone"
              dataKey="old_forecast_error"
              name="Ennustevirhe"
              stroke="#ef4444"
              dot={false}
              strokeWidth={1}
              strokeDasharray="2 2"
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeChart; 