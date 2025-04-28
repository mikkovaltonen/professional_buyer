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
    forecast?: number | null;
    old_forecast?: number | null;
    old_forecast_error?: number | null;
  }[];
  title: string;
}

const TimeChart: React.FC<TimeChartProps> = ({ data, title }) => {
  // Format date to show only month and year in Finnish
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fi-FI', { month: 'short', year: 'numeric' });
  };

  // Custom tooltip content with Finnish number formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-semibold">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            entry.value !== null && (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {entry.value.toLocaleString('fi-FI', { maximumFractionDigits: 0 })}
              </p>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px]">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
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
            name="Quantity"
            stroke="#4338ca"
            dot={false}
            strokeWidth={2}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="#f59e0b"
            dot={false}
            strokeWidth={2}
            strokeDasharray="5 5"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="old_forecast"
            name="Old Forecast"
            stroke="#10b981"
            dot={false}
            strokeWidth={2}
            strokeDasharray="3 3"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="old_forecast_error"
            name="Forecast Error"
            stroke="#ef4444"
            dot={false}
            strokeWidth={1}
            strokeDasharray="2 2"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeChart; 