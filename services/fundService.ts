import { Fund, DailyData, TRACKED_FUNDS } from '../types';

/**
 * fetchFundData
 * 
 * 从正确位置加载基金数据，使用基金代码作为唯一标识符
 * 当数据加载失败时抛出错误，不提供模拟数据
 */
export const fetchFundData = async (): Promise<Fund[]> => {
  try {
    // 尝试加载数据文件
    const timestamp = Date.now();
    console.log(`[FundService] 尝试加载基金数据，时间戳: ${timestamp}`);
    
    const response = await fetch(`https://csuleiw.github.io/fund-tracker-backend/data/fund-data.json?t=${timestamp}`);
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = '无法获取详细错误信息';
      }
      throw new Error(`HTTP错误 ${response.status}: ${response.statusText}. 服务器响应: ${errorText.substring(0, 200)}`);
    }
    
    // 验证响应是否为JSON
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`无效的响应内容类型: ${contentType}. 期待application/json.`);
    }
    
    const rawData = await response.json();
    
    // 验证数据格式
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('获取的数据为空或无效格式');
    }
    
    // 处理基金数据，使用代码作为唯一标识符
    const processedData = processFundData(rawData);
    
    console.log(`[FundService] ✓ 成功加载 ${processedData.length} 支基金数据`);
    return processedData;
  } catch (error) {
    console.error('[FundService] 数据加载失败:', error);
    // 不再提供模拟数据，直接抛出错误
    throw error;
  }
};

/**
 * 处理原始基金数据，确保使用代码作为唯一标识符
 */
const processFundData = (rawData: any[]): Fund[] => {
  // 创建一个映射：基金代码 -> 原始数据
  const fundCodeMap = new Map<string, any>();
  rawData.forEach(fund => {
    if (fund.code) {
      fundCodeMap.set(fund.code, fund);
    }
  });
  
  // 只返回我们跟踪的基金，并确保数据结构正确
  return TRACKED_FUNDS.map(config => {
    const rawData = fundCodeMap.get(config.code);
    
    if (!rawData) {
      console.error(`[FundService] 错误：找不到代码为 ${config.code} 的基金数据`);
      throw new Error(`缺失基金数据: ${config.name} (${config.code})`);
    }
    
    // 验证必要字段
    if (!rawData.history || !Array.isArray(rawData.history) || rawData.history.length === 0) {
      console.error(`[FundService] 错误：基金 ${config.code} 的历史数据无效或为空`);
      throw new Error(`无效历史数据: ${config.name} (${config.code})`);
    }
    
    // 确保最新日期和净值正确
    const latestEntry = rawData.history[rawData.history.length - 1];
    if (!latestEntry || !latestEntry.date || latestEntry.nav === undefined) {
      console.error(`[FundService] 错误：基金 ${config.code} 的最新数据条目不完整`);
      throw new Error(`不完整数据条目: ${config.name} (${config.code})`);
    }
    
    // 返回标准化的基金数据
    return {
      code: rawData.code,
      // 优先使用配置中的名称，确保一致性
      name: config.name,
      history: rawData.history.map((entry: any) => ({
        date: entry.date,
        nav: parseFloat(entry.nav),
        growthRate: parseFloat(entry.growthRate),
        cumulativeGrowth: entry.cumulativeGrowth !== undefined ? parseFloat(entry.cumulativeGrowth) : undefined
      })),
      latestNav: parseFloat(latestEntry.nav),
      latestDate: latestEntry.date,
      totalGrowth: latestEntry.cumulativeGrowth !== undefined ? parseFloat(latestEntry.cumulativeGrowth) : 0
    };
  });
};
