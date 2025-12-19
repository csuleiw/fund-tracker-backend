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
    <div className=
