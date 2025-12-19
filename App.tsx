import React, { useEffect, useState } from 'react';
import { fetchFundData } from './services/fundService';
import { Fund, BASELINE_DATE } from './types';
import { FundCard } from './components/FundCard';
import { FundChart } from './components/FundChart';
import { RefreshCw, BarChart3, Clock, CalendarDays } from 'lucide-react';

const App: React.FC = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 获取数据中显示的最新日期（假设所有基金日期同步，取第一个即可）
  const dataDate = funds.length > 0 ? funds[0].latestDate : '';

  const loadData = async () => {
    setLoading(true);
    try {
      // 现在的 fetchFundData 会请求静态 JSON，并带上时间戳防止浏览器缓存
      const data = await fetchFundData();
      setFunds(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            {/* 显示基准日配置 */}
            <div className="hidden md:flex items-center text-sm text-gray-500 space-x-1 bg-gray-100 px-3 py-1 rounded-full">
              <Clock size={14} />
              <span>基准日: {BASELINE_DATE}</span>
            </div>
            
            <button 
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{loading ? '检查更新...' : '刷新数据'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Intro Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">基金每日净值追踪</h2>
            <p className="text-gray-500 mt-1">
              自动统计指定ETF基金自 <span className="font-medium text-gray-700">{BASELINE_DATE}</span> 以来的累计涨跌幅。
            </p>
          </div>
          
          {/* 状态标签：改为显示数据来源和截止日期 */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
              数据源: Eastmoney
            </span>
            {dataDate && (
               <span className="flex items-center space-x-1 bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">
                 <CalendarDays size={12} />
                 <span>数据截止: {dataDate}</span>
               </span>
            )}
          </div>
        </div>

        {loading && funds.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-400 text-sm">正在加载最新数据...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {funds.map(fund => (
                <FundCard key={fund.code} fund={fund} />
              ))}
            </div>

            {/* Chart Section */}
            <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">收益走势对比</h3>
              <div className="h-[400px]">
                <FundChart funds={funds} />
              </div>
            </section>
            
            {/* Disclaimer */}
            <div className="text-center text-xs text-gray-400 mt-12 pb-8 border-t border-gray-100 pt-8">
              <p>说明：数据由系统每日收盘后自动抓取并更新。</p>
              <p>涨跌幅计算基于前复权（Forward Adjusted）价格。</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;