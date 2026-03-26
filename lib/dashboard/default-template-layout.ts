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
  { i: 'kpi-3', type: 'dayWinRate', size: 'kpi', x: 2, y: 0, w: 1, h: 1 },
  { i: 'kpi-4', type: 'profitFactor', size: 'kpi', x: 3, y: 0, w: 1, h: 1 },
  { i: 'kpi-5', type: 'avgWinLoss', size: 'kpi', x: 4, y: 0, w: 1, h: 1 },

  { i: 'equity-curve', type: 'equityCurve', size: 'large', x: 0, y: 1, w: 8, h: 4 },
  { i: 'drawdown', type: 'drawdown', size: 'small-long', x: 8, y: 1, w: 4, h: 4 },

  { i: 'performance-summary', type: 'performanceSummary', size: 'large', x: 0, y: 5, w: 8, h: 4 },
  { i: 'recent-trades', type: 'recentTrades', size: 'small', x: 8, y: 5, w: 4, h: 4 },

  { i: 'mini-calendar', type: 'calendarMini', size: 'large', x: 0, y: 9, w: 12, h: 6 },

  { i: 'net-daily-pnl', type: 'netDailyPnL', size: 'small-long', x: 0, y: 15, w: 4, h: 4 },
  { i: 'daily-cumulative-pnl', type: 'dailyCumulativePnL', size: 'small-long', x: 4, y: 15, w: 4, h: 4 },
  { i: 'account-balance', type: 'accountBalanceChart', size: 'small-long', x: 8, y: 15, w: 4, h: 4 },

  { i: 'outcome-dist', type: 'outcomeDistribution', size: 'medium', x: 0, y: 19, w: 4, h: 4 },
  { i: 'day-of-week', type: 'dayOfWeekPerformance', size: 'medium', x: 4, y: 19, w: 4, h: 4 },
  { i: 'weekday-pnl', type: 'weekdayPnL', size: 'small-long', x: 8, y: 19, w: 4, h: 4 },

  { i: 'pnl-by-strategy', type: 'pnlByStrategy', size: 'small-long', x: 0, y: 23, w: 4, h: 4 },
  { i: 'win-rate-by-strategy', type: 'winRateByStrategy', size: 'small-long', x: 4, y: 23, w: 4, h: 4 },
  { i: 'pnl-by-instrument', type: 'pnlByInstrument', size: 'small-long', x: 8, y: 23, w: 4, h: 4 },

  { i: 'performance-score', type: 'performanceScore', size: 'small-long', x: 0, y: 27, w: 4, h: 4 },
  { i: 'trade-duration', type: 'tradeDurationPerformance', size: 'small-long', x: 4, y: 27, w: 4, h: 4 },
  { i: 'session-analysis', type: 'sessionAnalysis', size: 'medium', x: 8, y: 27, w: 4, h: 4 },

  { i: 'calendar-advanced', type: 'calendarAdvanced', size: 'extra-large', x: 0, y: 31, w: 12, h: 8 },
]

export function cloneDefaultTemplateLayout(): TemplateLayoutItem[] {
  return DEFAULT_TEMPLATE_LAYOUT.map((item) => ({ ...item }))
}
