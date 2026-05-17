export interface TemplateLayoutItem {
  i: string
  type: string
  size: string
  x: number
  y: number
  w: number
  h: number
}

export const DEFAULT_TEMPLATE_LAYOUT: TemplateLayoutItem[] = [
  { i: 'kpi-1', type: 'accountBalancePnl', size: 'kpi', x: 0, y: 0, w: 1, h: 1 },
  { i: 'kpi-2', type: 'tradeWinRate', size: 'kpi', x: 1, y: 0, w: 1, h: 1 },
  { i: '0f139a04-41eb-43a5-bce7-416c2d4c784d', type: 'profitFactor', size: 'small', x: 2, y: 0, w: 1, h: 1 },
  { i: 'de6bfa2b-0bea-4dc0-9817-df75eb30cde5', type: 'dayWinRate', size: 'small', x: 3, y: 0, w: 1, h: 1 },
  { i: 'kpi-5', type: 'avgWinLoss', size: 'kpi', x: 4, y: 0, w: 1, h: 1 },

  { i: 'calendar-advanced', type: 'calendarAdvanced', size: 'extra-large', x: 0, y: 1, w: 8, h: 9 },
  { i: 'net-daily-pnl', type: 'netDailyPnL', size: 'small-long', x: 8, y: 1, w: 4, h: 4 },
  { i: 'weekday-pnl', type: 'weekdayPnL', size: 'small-long', x: 8, y: 5, w: 4, h: 5 },
  { i: 'performance-score', type: 'performanceScore', size: 'small-long', x: 0, y: 10, w: 4, h: 4 },
  { i: 'drawdown', type: 'drawdown', size: 'small-long', x: 8, y: 10, w: 4, h: 4 },
  { i: 'equity-curve', type: 'equityCurve', size: 'large', x: 0, y: 14, w: 4, h: 4 },
  { i: 'daily-cumulative-pnl', type: 'dailyCumulativePnL', size: 'small-long', x: 4, y: 14, w: 4, h: 4 },
  { i: 'recent-trades', type: 'recentTrades', size: 'small', x: 8, y: 14, w: 4, h: 8 },
  { i: 'win-rate-by-strategy', type: 'winRateByStrategy', size: 'small-long', x: 0, y: 18, w: 4, h: 4 },
  { i: 'account-balance', type: 'accountBalanceChart', size: 'small-long', x: 4, y: 18, w: 4, h: 4 },
  { i: 'pnl-by-strategy', type: 'pnlByStrategy', size: 'small-long', x: 0, y: 22, w: 4, h: 4 },
  { i: 'outcome-dist', type: 'outcomeDistribution', size: 'medium', x: 4, y: 22, w: 4, h: 4 },
  { i: 'pnl-by-instrument', type: 'pnlByInstrument', size: 'small-long', x: 8, y: 22, w: 4, h: 4 },
  { i: 'day-of-week', type: 'dayOfWeekPerformance', size: 'medium', x: 0, y: 26, w: 4, h: 4 },
  { i: 'session-analysis', type: 'sessionAnalysis', size: 'medium', x: 4, y: 26, w: 4, h: 4 },
  { i: 'hourly-performance', type: 'hourlyPerformance', size: 'medium', x: 8, y: 26, w: 4, h: 4 },
  { i: 'duration-analysis', type: 'durationAnalysis', size: 'medium', x: 0, y: 30, w: 4, h: 4 },
  { i: 'weekday-time-heatmap', type: 'weekdayTimeHeatmap', size: 'large', x: 4, y: 30, w: 8, h: 4 },
]

export function cloneDefaultTemplateLayout(): TemplateLayoutItem[] {
  return DEFAULT_TEMPLATE_LAYOUT.map((item) => ({ ...item }))
}
