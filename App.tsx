import React, { useEffect, useState } from 'react';
import { fetchFundData } from './services/fundService';
import { Fund, BASELINE_DATE } from './types';
import { FundCard } from './components/FundCard';
import { FundChart } from './components/FundChart';
import { RefreshCw, BarChart3, Clock, CalendarDays, AlertTriangle, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'real' | 'mock' | 'unknown'>('unknown');
  
  // 获取数据中显示的最新日期（假设所有基金日期同步，取第一个即可）
  const dataDate = funds.length > 0 ? funds[0].latestDate : '';
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    setDataSource('unknown');
    
    try {
      console.log('[App] 开始加载基金数据...');
      const startTime = Date.now();
      
      // 现在的 fetchFundData 会请求静态 JSON，并带上时间戳防止浏览器缓存
      const data = await fetchFundData();
      
      const loadTime = Date.now() - startTime;
      console.log(`[App] 数据加载完成，耗时: ${loadTime}ms`);
      
      // 增强数据验证
      if (!data || !Array.isArray(data)) {
        throw new Error('返回的数据不是有效的数组格式');
      }
      
      if (data.length === 0) {
        throw new Error('返回的数据为空数组');
      }
      
      // 验证数据完整性 - 检查关键字段
      const validationErrors = [];
      data.forEach((fund, index) => {
        if (!fund.code || !fund.name) {
          validationErrors.push(`基金[${index}] 缺少必要字段: code 或 name`);
        }
        if (!fund.history || !Array.isArray(fund.history) || fund.history.length === 0) {
          validationErrors.push(`基金[${index}] ${fund.name} 缺少有效的历史数据`);
        }
        if (fund.history.length > 0) {
          const latest = fund.history[fund.history.length - 1];
          if (!latest.date || latest.nav === undefined) {
            validationErrors.push(`基金[${index}] ${fund.name} 历史数据格式无效`);
          }
        }
      });
      
      if (validationErrors.length > 0) {
        console.warn('[App] 数据验证警告:', validationErrors);
        // 不抛出错误，但记录警告
      }
      
      // 检测是否为模拟数据
      const aiFund = data.find(f => f.code === '515980'); // 人工智能ETF
      if (aiFund && Math.abs(aiFund.latestNav - 0.836) < 0.001) {
        console.warn('[App] 警告: 检测到模拟数据特征 (0.836)');
        setDataSource('mock');
        // 不阻止显示，但标记为模拟数据
      } else {
        setDataSource('real');
      }
      
      setFunds(data);
      console.log('[App] 成功设置基金数据:', data);
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '未知错误';
      console.error('[App] 加载数据时发生错误:', e);
      setError(`数据加载失败: ${errorMessage}`);
      
      // 不回退到模拟数据，显示错误信息
      setFunds([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleRefresh = () => {
    if (!loading) {
      console.log('[App] 用户触发手动刷新');
      loadData();
    }
  };
  
  // 调试信息 - 仅在开发环境显示
  const isDev = process.env.NODE_ENV === 'development';
  const renderDebugInfo = () => {
    if (!isDev) return null;
    
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <div className="flex flex-wrap gap-4">
          <span>环境: {process.env.NODE_ENV}</span>
          <span>数据源: {dataSource === 'real' ? '✅ 真实数据' : dataSource === 'mock' ? '⚠️ 模拟数据' : '❓ 未知'}</span>
          <span>基金数量: {funds.length}</span>
          {funds.length > 0 && (
            <span>人工智能ETF净值: {funds.find(f => f.code === '515980')?.latestNav?.toFixed(4)}</span>
          )}
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
            {/* 显示基准日配置 */}
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
              <span className="hidden sm:inline">{loading ? '检查更新...' : '刷新数据'}</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Error Banner - 全局错误提示 */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">数据加载失败</p>
                <p>{error}</p>
                <p className="mt-1">建议操作: 检查网络连接，或尝试刷新页面。如果问题持续，请联系系统管理员。</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
            <span className={`px-2 py-1 rounded-md border ${
              dataSource === 'real' 
                ? 'bg-blue-50 text-blue-700 border-blue-100'
                : dataSource === 'mock'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                : 'bg-gray-50 text-gray-700 border-gray-100'
            }`}>
              {dataSource === 'real' && '✅ 真实数据'}
              {dataSource === 'mock' && '⚠️ 模拟数据'}
              {dataSource === 'unknown' && '❓ 数据加载中'}
            </span>
            
            <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">
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
        
        {renderDebugInfo()}
        
        {loading && funds.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-400 text-sm">正在加载最新数据...</p>
            <p className="text-gray-500 text-xs">如果长时间加载，请检查网络连接或尝试刷新页面</p>
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4 bg-red-50 p-8 rounded-lg border border-red-200">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <h3 className="text-lg font-medium text-red-700">数据加载失败</h3>
            <p className="text-gray-600 text-center">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              重试加载
            </button>
          </div>
        ) : funds.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4 bg-yellow-50 p-8 rounded-lg border border-yellow-200">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
            <h3 className="text-lg font-medium text-yellow-700">没有可用数据</h3>
            <p className="text-gray-600 text-center">无法获取基金数据，请检查配置或联系管理员</p>
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
              <p className="mt-1 text-gray-500">
                系统版本: v1.2.0 | 最后更新: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer - 仅在开发环境显示 */}
      {isDev && (
        <footer className="bg-gray-50 border-t border-gray-200 mt-8 py-4 text-center text-xs text-gray-500">
          <p>开发环境 - 请勿在生产环境使用模拟数据</p>
        </footer>
      )}
    </div>
  );
};

export default App;
