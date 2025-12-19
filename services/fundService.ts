import { Fund, TRACKED_FUNDS } from '../types';

// 定义返回结构，包含元数据
export interface FundResponse {
  data: Fund[];
  meta: {
    timestamp: number;
    validationErrors: string[];
  };
}

/**
 * fetchFundData
 * 负责获取、校验、清洗数据
 */
export const fetchFundData = async (): Promise<FundResponse> => {
  const validationErrors: string[] = [];
  const startTime = Date.now();
  
  try {
    console.log(`[FundService] 开始加载数据...`);
    
    // 1. 网络请求 (带防缓存时间戳)
    const response = await fetch(`https://csuleiw.github.io/fund-tracker-backend/data/fund-data.json?t=${startTime}`);
    
    if (!response.ok) {
      throw new Error(`HTTP错误 ${response.status}: ${response.statusText}`);
    }
    
    // 2. 基础格式校验
    const rawData = await response.json();
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('获取的数据格式无效或为空');
    }

    // 3. 数据清洗与深度校验
    // 创建映射以便快速查找
    const fundCodeMap = new Map<string, any>();
    rawData.forEach(f => { if (f.code) fundCodeMap.set(f.code, f); });

    // 遍历配置，只提取我们需要的数据
    const processedData = TRACKED_FUNDS.map((config) => {
      const raw = fundCodeMap.get(config.code);
      
      // 校验存在性
      if (!raw) {
        validationErrors.push(`配置中的基金 ${config.name}(${config.code}) 在数据源中缺失`);
        throw new Error(`缺失必要基金数据: ${config.code}`);
      }

      // 校验历史数据完整性
      if (!raw.history || !Array.isArray(raw.history) || raw.history.length === 0) {
        validationErrors.push(`基金 ${config.code} 历史数据为空`);
        throw new Error(`无效历史数据: ${config.code}`);
      }

      // 获取最新一条数据
      const latestEntry = raw.history[raw.history.length - 1];
      
      // 校验关键字段
      if (!latestEntry.date || latestEntry.nav === undefined) {
        throw new Error(`基金 ${config.code} 最新数据条目缺失日期或净值`);
      }

      // 格式化数据：强制使用配置名称，确保数值类型正确
      return {
        code: raw.code,
        name: config.name, 
        history: raw.history.map((entry: any) => ({
          date: entry.date,
          nav: parseFloat(entry.nav),
          growthRate: parseFloat(entry.growthRate || 0),
          cumulativeGrowth: entry.cumulativeGrowth !== undefined ? parseFloat(entry.cumulativeGrowth) : undefined
        })),
        latestNav: parseFloat(latestEntry.nav),
        latestDate: latestEntry.date,
        totalGrowth: latestEntry.cumulativeGrowth !== undefined ? parseFloat(latestEntry.cumulativeGrowth) : 0
      };
    });

    console.log(`[FundService] 数据处理完成，共 ${processedData.length} 条`);

    return {
      data: processedData,
      meta: {
        timestamp: Date.now(),
        validationErrors
      }
    };

  } catch (error) {
    console.error('[FundService] 处理失败:', error);
    throw error;
  }
};
