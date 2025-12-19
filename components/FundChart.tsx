import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine} from 'recharts';
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
  
  // 1. 严格按原始数据收集唯一日期，不做任何转换
  const allDates = Array.from(
    new Set(
      funds
        .flatMap(fund => fund.history.map(record => record.date))
        .filter(date => date) // 过滤无效日期
    )
  ).sort();

  // 2. 严格使用原始数据构建图表数据，不做任何计算
  const chartData = allDates.map(date => {
    const entry: Record<string, any> = { date }; // 使用更严格的类型
    
    funds.forEach(fund => {
      // 严格查找匹配日期的数据，不进行任何插值或平均
      const dayData = fund.history.find(h => h.date === date && h.cumulativeGrowth !== undefined && h.cumulativeGrowth !== null);
      
      if (dayData) {
        // 直接使用原始累积增长率，不做任何转换
        entry[fund.name] = dayData.cumulativeGrowth;
      }
      // 如果找不到精确匹配的数据点，不添加该基金此日期的值（保持undefined）
    });
    
    return entry;
  });

  // 调试：在开发环境记录数据形状
  if (process.env.NODE_ENV === 'development') {
    console.log('[FundChart] 原始图表数据形状:', {
      dateCount: allDates.length,
      fundCount: funds.length,
      firstDate: allDates[0],
      lastDate: allDates[allDates.length - 1],
      sampleDataPoint: chartData[chartData.length - 1]
    });
  }

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
            // 确保显示最新日期
            interval="preserveEnd"
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            unit="%"
          />
          <Tooltip
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              backgroundColor: 'white'
            }}
            itemStyle={{ fontSize: '13px', fontWeight: 500 }}
            labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}
            formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
            labelFormatter={(label: string) => `日期: ${label}`}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }} 
            payload={funds.map((fund, index) => ({
              id: fund.code,
              type: 'line',
              value: fund.name,
              color: COLORS[index % COLORS.length]
            }))}
          />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          
          {funds.map((fund, index) => (
            <Line
              key={fund.code + '-line'} // 确保唯一key
              type="monotone"
              dataKey={fund.name}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 6,
                stroke: COLORS[index % COLORS.length],
                strokeWidth: 2
              }}
              connectNulls={false} // 关键修改：不连接空值，避免插值
              isAnimationActive={false} // 禁用动画，确保数据精确呈现
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
