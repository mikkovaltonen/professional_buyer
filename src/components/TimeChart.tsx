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
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value !== null ? entry.value.toLocaleString('fi-FI', { maximumFractionDigits: 0 }) : '-'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] p-4">
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
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toLocaleString('fi-FI', { maximumFractionDigits: 0 })}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name="Quantity"
            stroke="#00008B"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
          {data.some(item => item.forecast !== null) && (
            <Line
              type="monotone"
              dataKey="forecast"
              name="forecast_12m"
              stroke="#FFA500"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          )}
          {data.some(item => item.old_forecast !== null) && (
            <Line
              type="monotone"
              dataKey="old_forecast"
              name="old_forecast"
              stroke="#008000"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          )}
          {data.some(item => item.old_forecast_error !== null) && (
            <Line
              type="monotone"
              dataKey="old_forecast_error"
              name="old_forecast_error"
              stroke="#00BFFF"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeChart; 