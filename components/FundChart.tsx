import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Fund } from '../types';

interface FundChartProps {
  funds: Fund[];
}

// Color palette for lines
const COLORS = [
  '#2563eb', // Blue
  '#db2777', // Pink
  '#d97706', // Amber
  '#7c3aed', // Violet
  '#059669'  // Emerald
];

export const FundChart: React.FC<FundChartProps> = ({ funds }) => {
  if (funds.length === 0) return null;

  // Transform data: We need an array of objects where each object is a date, 
  // and keys are fund names/codes with their cumulative growth values.
  
  // 1. Collect all unique dates from all funds
  const allDates = Array.from(new Set(funds.flatMap(f => f.history.map(d => d.date)))).sort();

  // 2. Build the chart data
  const chartData = allDates.map(date => {
    const entry: any = { date };
    funds.forEach(fund => {
      const dayData = fund.history.find(h => h.date === date);
      if (dayData && dayData.cumulativeGrowth !== undefined) {
        entry[fund.name] = dayData.cumulativeGrowth;
      }
    });
    return entry;
  });

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">累计收益走势 (%)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#64748b' }} 
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
            minTickGap={30}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#64748b' }} 
            tickLine={false}
            axisLine={false}
            unit="%"
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ fontSize: '13px', fontWeight: 500 }}
            labelStyle={{ color: '#64748b', marginBottom: '4px' }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, '']}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          
          {funds.map((fund, index) => (
            <Line
              key={fund.code}
              type="monotone"
              dataKey={fund.name}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
