import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// --- 为了避免引用路径错误，我们将配置内联在此处 ---
// 这样脚本就是完全独立的，不再依赖 src 目录，修复所有 ERR_MODULE_NOT_FOUND 问题

const BASELINE_DATE = '2025-12-01';

const TRACKED_FUNDS = [
  { code: '588000', name: '科创50ETF' },
  { code: '515980', name: '人工智能ETF' },
  { code: '515100', name: '红利ETF' },
  { code: '515030', name: '新能源车ETF' },
  { code: '159338', name: '信创ETF' },
];

interface DailyData {
  date: string;
  nav: number;
  growthRate: number;
  cumulativeGrowth?: number;
}

interface Fund {
  code: string;
  name: string;
  history: DailyData[];
  latestNav: number;
  latestDate: string;
  totalGrowth: number;
}
// ----------------------------------------------------

// 获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 输出路径: public/data/fund-data.json
const OUTPUT_FILE = path.join(__dirname, '../data/fund-data.json');

const getSecId = (code: string) => {
  if (code.startsWith('5') || code.startsWith('6')) return `1.${code}`;
  return `0.${code}`;
};

const run = async () => {
  console.log(`[${new Date().toISOString()}] 开始执行基金数据抓取...`);
  
  const results: Fund[] = [];
  const apiStartDate = BASELINE_DATE.replace(/-/g, '');

  for (const fundConfig of TRACKED_FUNDS) {
    try {
      console.log(`正在抓取: ${fundConfig.name} (${fundConfig.code})...`);
      const secId = getSecId(fundConfig.code);
      
      const response = await axios.get('https://push2his.eastmoney.com/api/qt/stock/kline/get', {
        params: {
          secid: secId,
          fields1: 'f1',
          fields2: 'f51,f53',
          klt: '101',
          fqt: '1',
          beg: apiStartDate,
          end: '20991231'
        },
        timeout: 10000 
      });

      const data = response.data;

      if (!data || !data.data || !data.data.klines || data.data.klines.length === 0) {
        console.warn(`⚠️  无数据返回: ${fundConfig.name} (${fundConfig.code})`);
        continue;
      }

      const rawKlines: string[] = data.data.klines;

      const parsedHistory = rawKlines.map(item => {
        const [date, priceStr] = item.split(',');
        return { date, nav: parseFloat(priceStr) };
      });

      if (parsedHistory.length === 0) continue;

      const baseNav = parsedHistory[0].nav;
      
      const history: DailyData[] = parsedHistory.map((day, index) => {
        const prevNav = index > 0 ? parsedHistory[index - 1].nav : baseNav;
        const growthRate = ((day.nav - prevNav) / prevNav) * 100;
        const cumulativeGrowth = ((day.nav - baseNav) / baseNav) * 100;

        return {
          date: day.date,
          nav: day.nav,
          growthRate: parseFloat(growthRate.toFixed(2)),
          cumulativeGrowth: parseFloat(cumulativeGrowth.toFixed(2))
        };
      });

      const latest = history[history.length - 1];

      results.push({
        code: fundConfig.code,
        name: fundConfig.name,
        history,
        latestNav: latest.nav,
        latestDate: latest.date,
        totalGrowth: latest.cumulativeGrowth || 0
      });

    } catch (error: any) {
      console.error(`❌ 抓取失败 ${fundConfig.name}:`, error.message);
    }
  }

  try {
    await fs.ensureDir(path.dirname(OUTPUT_FILE));
    await fs.writeJson(OUTPUT_FILE, results, { spaces: 2 });
    console.log(`\n✅ 数据更新成功! 已保存至: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('❌ 文件写入失败:', err);
    process.exit(1);
  }
};

run();