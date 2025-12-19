import { Fund, DailyData, TRACKED_FUNDS, BASELINE_DATE } from '../types';

/**
 * fetchFundData
 * 
 * 从正确位置加载基金数据，增强错误处理
 */
export const fetchFundData = async (): Promise<Fund[]> => {
  try {
    // 尝试多个可能的路径 - 根据Vite/CRA的常见配置
    const possiblePaths = [
      '/fund-tracker-backend/data/fund-data.json',    // 备选2 - 相对路径data目录
    ];

    let lastError: Error | null = null;
    let successfulPath = '';
    let finalData: Fund[] = [];

    // 依次尝试所有可能的路径
    for (const path of possiblePaths) {
      try {
        const timestamp = Date.now();
        console.log(`[FundService] 尝试加载数据: ${path}?t=${timestamp}`);
        
        const response = await fetch(`${path}?t=${timestamp}`);
        
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

        const data = await response.json();
        
        // 验证数据格式
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('获取的数据为空或无效格式');
        }
        
        successfulPath = path;
        finalData = data;
        console.log(`[FundService] ✓ 成功从 ${path} 加载 ${data.length} 支基金数据`);
        break; // 找到有效数据，退出循环
      } catch (error) {
        console.warn(`[FundService] 从 ${path} 加载失败:`, error.message || error);
        lastError = error as Error;
      }
    }

    if (successfulPath) {
      return finalData;
    }
    
    throw lastError || new Error('所有可能的路径都尝试失败');
  } catch (error) {
    console.error('[FundService] 严重错误:', error);
    console.warn('[FundService] 无法获取真实数据，回退到模拟数据');
    return generateMockData();
  }
};

/**
 * Fallback: Generates simulated data if static file fetch fails
 * (仅用于本地开发初期或网络错误时的兜底展示)
 */
const generateMockData = (): Fund[] => {
  // 代码保持不变...
  const getDatesInRange = (startDate: Date, endDate: Date) => {
    const date = new Date(startDate.getTime());
    const dates = [];
    while (date <= endDate) {
      const day = date.getDay(); // 跳过周末 (0=周日, 6=周六)
      if (day !== 0 && day !== 6) dates.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const start = new Date(BASELINE_DATE);
  const end = new Date(); // 今天

  // 如果基准日期在未来（配置错误的情况），修正为过去的一个时间以生成演示数据
  if (start > end) {
    start.setMonth(end.getMonth() - 1);
  }

  const dates = getDatesInRange(start, end);

  return TRACKED_FUNDS.map(fundConfig => {
    let currentNav = 1.000;
    const volatility = 0.015; // 波动率
    const trend = (Math.random() - 0.45) * 0.002; // 微小的随机趋势

    const history: DailyData[] = dates.map((date, index) => {
      // 第一天初始化
      if (index === 0) {
        return {
          date: formatDate(date),
          nav: currentNav,
          growthRate: 0,
          cumulativeGrowth: 0
        };
      }

      const changePercent = (Math.random() - 0.5) * 2 * volatility + trend;
      currentNav = currentNav * (1 + changePercent);
      const cumulative = ((currentNav - 1.000) / 1.000) * 100;

      return {
        date: formatDate(date),
        nav: parseFloat(currentNav.toFixed(4)),
        growthRate: parseFloat((changePercent * 100).toFixed(2)),
        cumulativeGrowth: parseFloat(cumulative.toFixed(2))
      };
    });

    // 如果生成的数据为空（例如日期范围问题），返回空数组防止报错
    if (history.length === 0) return null;

    const latest = history[history.length - 1];
    return {
      code: fundConfig.code,
      name: fundConfig.name,
      history,
      latestNav: latest.nav,
      latestDate: latest.date,
      totalGrowth: latest.cumulativeGrowth || 0
    };
  }).filter((f): f is Fund => f !== null); // 过滤掉可能的 null
};
