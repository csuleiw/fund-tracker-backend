import React from 'react';
import { Fund } from '../types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface FundCardProps {
  fund: Fund;
}

export const FundCard: React.FC<FundCardProps> = ({ fund }) => {
  // 严格验证数据完整性
  const hasValidData = fund.latestNav !== null && fund.latestNav !== undefined && fund.latestDate;
  
  // 严格使用原始值，不做任何计算
  const isPositive = hasValidData && fund.totalGrowth > 0;
  const isZero = hasValidData && fund.totalGrowth === 0;
  
  // Chinese market colors: Red = Up, Green = Down
  const colorClass = isPositive ? 'text-market-up' : isZero ? 'text-gray-500' : 'text-market-down';
  const bgClass = isPositive ? 'bg-red-50' : isZero ? 'bg-gray-50' : 'bg-green-50';
  const borderClass = isPositive ? 'border-l-4 border-market-up' : isZero ? 'border-l-4 border-gray-400' : 'border-l-4 border-market-down';
  
  // 调试：在开发环境记录原始净值
  if (process.env.NODE_ENV === 'development' && hasValidData) {
    console.log(`[FundCard] ${fund.name} 原始净值:`, {
      code: fund.code,
      rawNav: fund.latestNav,
      formattedNav: fund.latestNav.toFixed(3),
      date: fund.latestDate,
      totalGrowth: fund.totalGrowth
    });
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow ${borderClass}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{fund.name}</h3>
          <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            {fund.code}
          </span>
          {!hasValidData && (
            <span className="ml-2 text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded flex items-center">
              <AlertTriangle size={12} className="mr-1" />
              数据异常
            </span>
          )}
        </div>
        <div className={`p-2 rounded-full ${bgClass}`}>
          {hasValidData ? (
            isPositive ? (
              <TrendingUp size={20} className={colorClass} />
            ) : isZero ? (
              <Minus size={20} className={colorClass} />
            ) : (
              <TrendingDown size={20} className={colorClass} />
            )
          ) : (
            <AlertTriangle size={20} className="text-yellow-500" />
          )}
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-end">
        <div>
          <p className="text-xs text-gray-500 mb-1">
            {hasValidData ? `最新收盘价 (${fund.latestDate})` : '数据不可用'}
          </p>
          {hasValidData ? (
            // 关键修改：直接使用原始净值，不做任何转换
            // 仅在显示时格式化为3位小数，不对原始值做任何计算
            <p className="text-2xl font-semibold text-gray-900">
              {fund.latestNav.toFixed(3)}
            </p>
          ) : (
            <p className="text-2xl font-semibold text-yellow-600 animate-pulse">
              加载中...
            </p>
          )}
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">区间涨幅</p>
          {hasValidData ? (
            <p className={`text-xl font-bold ${colorClass}`}>
              {isPositive ? '+' : ''}{fund.totalGrowth.toFixed(2)}%
            </p>
          ) : (
            <p className="text-xl font-bold text-yellow-600">
              --
            </p>
          )}
        </div>
      </div>
      
      {/* 数据验证提示 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && hasValidData && (
        <div className="mt-2 text-[10px] text-gray-400">
          原始净值: {fund.latestNav}
        </div>
      )}
    </div>
  );
};
