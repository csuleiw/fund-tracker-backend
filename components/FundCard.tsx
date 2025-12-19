import React from 'react';
import { Fund } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FundCardProps {
  fund: Fund;
}

export const FundCard: React.FC<FundCardProps> = ({ fund }) => {
  const isPositive = fund.totalGrowth > 0;
  const isZero = fund.totalGrowth === 0;

  // Chinese market colors: Red = Up, Green = Down
  const colorClass = isPositive 
    ? 'text-market-up' 
    : isZero 
      ? 'text-gray-500' 
      : 'text-market-down';

  const bgClass = isPositive
    ? 'bg-red-50'
    : isZero
      ? 'bg-gray-50'
      : 'bg-green-50';

  const borderClass = isPositive
    ? 'border-l-4 border-market-up'
    : isZero
      ? 'border-l-4 border-gray-400'
      : 'border-l-4 border-market-down';

  return (
    <div className={`bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow ${borderClass}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{fund.name}</h3>
          <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            {fund.code}
          </span>
        </div>
        <div className={`p-2 rounded-full ${bgClass}`}>
          {isPositive ? (
            <TrendingUp size={20} className={colorClass} />
          ) : isZero ? (
            <Minus size={20} className={colorClass} />
          ) : (
            <TrendingDown size={20} className={colorClass} />
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-between items-end">
        <div>
          {/* 修改点 1: 文案改为“最新收盘价”，因为 ETF 实际上是场内交易价格 */}
          <p className="text-xs text-gray-500 mb-1">最新收盘价 ({fund.latestDate})</p>
          
          {/* 修改点 2: ETF 交易价格通常保留 3 位小数 */}
          <p className="text-2xl font-semibold text-gray-900">{fund.latestNav.toFixed(3)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">区间涨幅</p>
          <p className={`text-xl font-bold ${colorClass}`}>
            {isPositive ? '+' : ''}{fund.totalGrowth.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};