export interface DailyData {
  date: string;
  nav: number; // Net Asset Value (单位净值)
  growthRate: number; // Daily growth rate (日增长率)
  cumulativeGrowth?: number; // Calculated cumulative growth since start date
}

export interface Fund {
  code: string;
  name: string;
  history: DailyData[];
  latestNav: number;
  latestDate: string;
  totalGrowth: number; // Total growth from baseline
}

// Configuration for the funds we want to track
export const TRACKED_FUNDS = [
  { code: '588000', name: '科创50ETF' },
  { code: '515980', name: '人工智能ETF' },
  { code: '515100', name: '红利ETF' },
  { code: '515030', name: '新能源车ETF' },
  { code: '159338', name: '信创ETF' },
];

// Baseline date for calculation (Correcting 2025 to 2024 for realistic context)
export const BASELINE_DATE = '2025-12-01';
