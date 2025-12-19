import { Fund, DailyData, TRACKED_FUNDS, BASELINE_DATE } from '../types';

/**
 * fetchFundData
 * 
 * 从正确位置加载基金数据，增强错误处理
 * 注意：已临时禁用模拟数据回退，以便调试真实数据问题
 */
export const fetchFundData = async (): Promise<Fund[]> => {
  try {
    // 使用最可能工作的绝对路径
    const dataUrl = 'https://csuleiw.github.io/fund-tracker-backend/data/fund-data.json';
    const timestamp = Date.now();
    
    console.log(`[FundService] 尝试加载数据: ${dataUrl}?t=${timestamp}`);
    console.log(`[FundService] 当前页面URL: ${window.location.href}`);
    
    const response = await fetch(`${dataUrl}?t=${timestamp}`);
    
    // 详细记录响应信息
    console.log(`[FundService] 响应状态: ${response.status} ${response.statusText}`);
    console.log(`[FundService] 响应头 Content-Type: ${response.headers.get('content-type')}`);
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
        console.log(`[FundService] 服务器响应内容: ${errorText.substring(0, 200)}`);
      } catch (e) {
        errorText = '无法获取详细错误信息';
      }
      throw new Error(`HTTP错误 ${response.status}: ${response.statusText}. 服务器响应: ${errorText.substring(0, 200)}`);
    }
    
    // 验证响应是否为JSON
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error(`[FundService] 非JSON响应内容:`, responseText.substring(0, 500));
      throw new Error(`无效的响应内容类型: ${contentType}. 期待application/json. 响应内容前500字符: ${responseText.substring(0, 500)}`);
    }
    
    const data = await response.json();
    
    // 详细验证数据结构
    console.log(`[FundService] 原始JSON数据:`, data);
    
    if (!Array.isArray(data)) {
      console.error('[FundService] 数据不是数组:', typeof data, data);
      throw new Error('获取的数据不是数组格式');
    }
    
    if (data.length === 0) {
      console.error('[FundService] 数据数组为空');
      throw new Error('获取的数据为空数组');
    }
    
    // 验证第一项数据结构
    const firstItem = data[0];
    console.log(`[FundService] 第一支基金原始数据:`, firstItem);
    
    if (!firstItem.code || !firstItem.name || !firstItem.history) {
      console.error('[FundService] 数据结构不符合预期 - 缺少必要字段');
      throw new Error('数据结构无效 - 缺少必要字段 (code, name, history)');
    }
    
    // 确保history是数组且有数据
    if (!Array.isArray(firstItem.history) || firstItem.history.length === 0) {
      console.error('[FundService] 历史数据无效:', firstItem.history);
      throw new Error('历史数据格式无效或为空');
    }
    
    // 验证第一个历史数据项
    const firstHistoryItem = firstItem.history[0];
    console.log(`[FundService] 第一条历史数据:`, firstHistoryItem);
    
    if (!firstHistoryItem.date || firstHistoryItem.nav === undefined) {
      console.error('[FundService] 历史数据项缺少必要字段');
      throw new Error('历史数据项缺少必要字段 (date, nav)');
    }
    
    console.log(`[FundService] ✓ 成功加载 ${data.length} 支基金数据`);
    console.log(`[FundService] 数据加载完成，准备返回数据`);
    
    return data;
    
  } catch (error) {
    console.error('[FundService] 严重错误 - 无法加载基金数据:', error);
    console.error('[FundService] 错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // 临时：不回退到模拟数据，强制暴露问题
    console.warn('[FundService] 注意: 模拟数据已临时禁用，正在抛出原始错误');
    throw new Error(`[FundService] 数据加载失败: ${error.message || '未知错误'}`);
    
    // 永久修复前不要启用以下代码
    // console.warn('[FundService] 无法获取真实数据，回退到模拟数据');
    // return generateMockData();
  }
};

/**
 * 模拟数据生成函数 - 已临时禁用
 * 
 * 警告：此函数会生成随机数据，与真实市场数据不符
 * 仅在确认真实数据源问题已解决后才可重新启用
 */
// const generateMockData = (): Fund[] => {
//   console.error('[FundService] 错误: 不应调用模拟数据生成函数 - 此功能已临时禁用');
//   console.error('[FundService] 请修复真实数据源问题，而不是依赖模拟数据');
//   throw new Error('模拟数据功能已临时禁用 - 请修复真实数据源');
  
//   // 以下为原始代码，已注释
//   /*
//   const getDatesInRange = (startDate: Date, endDate: Date) => {
//     const date = new Date(startDate.getTime());
//     const dates = [];
//     while (date <= endDate) {
//       const day = date.getDay(); // 跳过周末 (0=周日, 6=周六)
//       if (day !== 0 && day !== 6) dates.push(new Date(date));
//       date.setDate(date.getDate() + 1);
//     }
//     return dates;
//   };
  
//   const formatDate = (date: Date) => date.toISOString().split('T')[0];
//   const start = new Date(BASELINE_DATE);
//   const end = new Date(); // 今天
//   // 如果基准日期在未来（配置错误的情况），修正为过去的一个时间以生成演示数据
//   if (start > end) {
//     start.setMonth(end.getMonth() - 1);
//   }
  
//   const dates = getDatesInRange(start, end);
//   return TRACKED_FUNDS.map(fundConfig => {
//     let currentNav = 1.000;
//     const volatility = 0.015; // 波动率
//     const trend = (Math.random() - 0.45) * 0.002; // 微小的随机趋势
//     const history: DailyData[] = dates.map((date, index) => {
//       // 第一天初始化
//       if (index === 0) {
//         return {
//           date: formatDate(date),
//           nav: currentNav,
//           growthRate: 0,
//           cumulativeGrowth: 0
//         };
//       }
//       const changePercent = (Math.random() - 0.5) * 2 * volatility + trend;
//       currentNav = currentNav * (1 + changePercent);
//       const cumulative = ((currentNav - 1.000) / 1.000) * 100;
//       return {
//         date: formatDate(date),
//         nav: parseFloat(currentNav.toFixed(4)),
//         growthRate: parseFloat((changePercent * 100).toFixed(2)),
//         cumulativeGrowth: parseFloat(cumulative.toFixed(2))
//       };
//     });
//     // 如果生成的数据为空（例如日期范围问题），返回空数组防止报错
//     if (history.length === 0) return null;
//     const latest = history[history.length - 1];
//     return {
//       code: fundConfig.code,
//       name: fundConfig.name,
//       history,
//       latestNav: latest.nav,
//       latestDate: latest.date,
//       totalGrowth: latest.cumulativeGrowth || 0
//     };
//   }).filter((f): f is Fund => f !== null); // 过滤掉可能的 null
//   */
// };
