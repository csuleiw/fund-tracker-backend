import React, { useEffect, useState } from 'react';
import { fetchFundData, FundResponse } from './services/fundService';
import { Fund, BASELINE_DATE } from './types';
import { FundCard } from './components/FundCard';
import { FundChart } from './components/FundChart';
import { RefreshCw, BarChart3, Clock, CalendarDays, AlertTriangle, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [meta, setMeta] = useState<FundResponse['meta'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 安全获取显示用的日期
  const displayDate = funds.length > 0 ? funds[0].latestDate : '';
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 调用服务层获取数据
      const { data, meta } = await fetchFundData();
      
      setFunds(data);
      setMeta(meta);
      
      if (meta.validationErrors.length > 0) {
        console.warn('部分非致命数据校验警告:', meta.validationErrors);
      }
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '未知错误';
      setError(`数据加载失败: ${errorMessage}`);
      setFunds([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  const handleRefresh = () => {
    if (!loading) loadData();
  };
  
  // 调试信息组件化
  const DebugInfo = () => {
    if (process.env.NODE_ENV !== 'development' || !meta) return null;
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <span className="font-mono">ENV: {process.env.NODE_ENV}</span>
          <span>ITEMS: {funds.length}</span>
          <span>Updated: {new Date(meta.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-12 bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
              <BarChart3 className="text-white h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Fund Tracker Pro</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-sm text-gray-500 space-x-1 bg-gray-100 px-3 py-1 rounded-full">
              <Clock size={14} />
              <span>基准日: {BASELINE_DATE}</span>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{loading ? '更新中...' : '刷新'}</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Global Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <span className="font-bold mr-1">错误:</span> {error}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Intro & Status Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">基金每日净值追踪</h2>
            <p className="text-gray-500 mt-1">
              自动统计指定ETF基金自 <span className="font-medium text-gray-700">{BASELINE_DATE}</span> 以来的累计涨跌幅。
            </p>
          </div>
          
          {/* 只保留数据截止日期的提示，移除模拟数据标签 */}
          {displayDate && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-md border border-green-100 font-medium">
                <CalendarDays size={14} />
                <span>数据截止: {displayDate}</span>
              </span>
            </div>
          )}
        </div>
        
        <DebugInfo />
        
        {/* Content States */}
        {loading && funds.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-400 text-sm">正在同步最新净值...</p>
          </div>
        ) : funds.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {funds.map(fund => (
                <FundCard key={fund.code} fund={fund} />
              ))}
            </div>
            
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">收益走势对比</h3>
              <div className="h-[400px]">
                <FundChart funds={funds} />
              </div>
            </section>
            
            <div className="text-center text-xs text-gray-400 mt-12 pb-8 border-t border-gray-100 pt-8">
              <p>说明：数据由系统每日收盘后自动抓取并更新，仅供参考。</p>
            </div>
          </div>
        ) : !loading && !error && (
          <div className="flex flex-col justify-center items-center h-64 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
            <p className="text-yellow-700">暂无可用数据</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
