/**
 * React Query hook for server-filtered trades
 * 
 * Replaces the `formattedTrades` useMemo + `statistics` useMemo + 
 * `calendarData` useMemo in DataProvider with a single server call.
 * 
 * All 7 filters applied server-side via /api/v1/trades
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import {
  calculateDayOfWeekPerformance,
  calculateOutcomeDistribution,
  calculateEquityCurve,
  calculateNetDailyPnl,
  calculateDailyCumulativePnl,
  calculateAccountBalanceChart,
  calculatePnlByStrategy,
  calculatePnlByInstrument,
  calculateWinRateByStrategy,
  calculateTradeDurationPerformance,
  calculateWeekdayPnl,
  calculatePerformanceScoreResult,
  calculateSessionAnalysis,
  calculateAccountProgression,
  calculateTagPerformance,
  calculateTimeOfDayPerformance,
  calculateDisciplineAnalytics,
} from '@/lib/dashboard-math'
import { calculateBalanceInfo } from '@/lib/utils/balance-calculator'
import { formatCalendarData, calculateStatistics } from '@/lib/utils'

export interface TradeFilters {
  accounts?: string[]
  dateFrom?: string
  dateTo?: string
  instruments?: string[]
  pnlMin?: number
  pnlMax?: number
  timeRange?: string | null
  weekday?: number | null
  hour?: number | null
  limit?: number
  pageLimit?: number
  pageOffset?: number
  includeStats?: boolean
  includeCalendar?: boolean
  timezone?: string
}

export interface FilteredTradesResponse {
  trades: any[]
  total: number
  page?: { limit: number; offset: number } | null
  statistics: any | null
  calendarData: any | null
  widgets: Record<string, any> | null
}

function buildQueryString(filters: TradeFilters): string {
  const params = new URLSearchParams()
  
  if (filters.accounts?.length) params.set('accounts', filters.accounts.join(','))
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (filters.instruments?.length) params.set('instruments', filters.instruments.join(','))
  if (filters.pnlMin !== undefined) params.set('pnlMin', String(filters.pnlMin))
  if (filters.pnlMax !== undefined) params.set('pnlMax', String(filters.pnlMax))
  if (filters.timeRange) params.set('timeRange', filters.timeRange)
  if (filters.weekday !== null && filters.weekday !== undefined) params.set('weekday', String(filters.weekday))
  if (filters.hour !== null && filters.hour !== undefined) params.set('hour', String(filters.hour))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.pageLimit !== undefined && filters.pageLimit !== null) params.set('pageLimit', String(filters.pageLimit))
  if (filters.pageOffset !== undefined && filters.pageOffset !== null) params.set('pageOffset', String(filters.pageOffset))
  if (filters.includeStats === false) params.set('includeStats', 'false')
  if (filters.includeCalendar === false) params.set('includeCalendar', 'false')
  if (filters.timezone) params.set('timezone', filters.timezone)
  
  return params.toString()
}

export function useFilteredTrades(filters: TradeFilters, enabled = true, isDemoMode = false) {
  const queryString = buildQueryString(filters)
  
  return useQuery<FilteredTradesResponse>({
    // IMPORTANT: use stable key (string), not object reference
    queryKey: ['v1', 'trades', queryString, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        // Return dummy response
        return getMockDemoData();
      }
      const res = await fetch(`/api/v1/trades?${queryString}`)
      if (!res.ok) throw new Error('Failed to fetch trades')
      return res.json()
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 min — realtime subscriptions handle live updates
    gcTime: 5 * 60 * 1000,
  })
}

export function getMockTradesList() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const prevDaysInMonth = new Date(prevYear, prevMonth + 1, 0).getDate()

  const instruments = ['EURUSD', 'NQ100', 'XAUUSD', 'GBPUSD', 'SPX500']
  const strategies = ['EMA Cross', 'ICT Silver Bullet', 'SMT Divergence', 'Liquidity Sweep', 'Order Block']
  const rules = ['Stop Loss Set', 'Risk Managed', 'Plan Followed', 'No FOMO', 'New York Session Only']
  const tags = ['Trend', 'Reversal', 'Breakout', 'Range', 'Session Start']
  const sides = ['LONG', 'SHORT']

  const instrumentPrices: Record<string, number> = {
    EURUSD: 1.0850,
    NQ100: 18500.0,
    XAUUSD: 2350.0,
    GBPUSD: 1.2720,
    SPX500: 5300.0
  }

  // Generate 80 trades distributed across current and previous month
  const trades = Array.from({ length: 80 }).map((_, i) => {
    let entryTime: Date
    if (i < 65) {
      // 65 trades distributed across current month (days 1 to min(daysInMonth, 28))
      const maxDay = Math.min(daysInMonth, 28)
      const day = 1 + Math.floor((i / 65) * maxDay)
      entryTime = new Date(year, month, day)
    } else {
      // 15 trades in the previous month (last 15 days)
      const idx = i - 65
      const day = Math.max(1, prevDaysInMonth - 15 + idx)
      entryTime = new Date(prevYear, prevMonth, day)
    }

    // Win rate around 55%
    const isWin = Math.random() > 0.45
    // Win: $150 to $950, Loss: -$100 to -$450
    const pnl = isWin 
      ? Math.floor(150 + Math.random() * 800) 
      : -Math.floor(100 + Math.random() * 350)
      
    const quantity = Math.floor((1 + Math.random() * 4) * 10) / 10
    const commission = -Math.floor((1.5 + Math.random() * 2) * quantity * 100) / 100
    const netPnl = pnl + commission
    const durationMin = Math.floor(10 + Math.random() * 240)

    // Randomize entry hour (between 8:00 and 17:00 NY time roughly)
    entryTime.setHours(8 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60), 0, 0)
    
    const exitTime = new Date(entryTime.getTime() + durationMin * 60 * 1000)

    const basePrice = instrumentPrices[instruments[i % instruments.length]]
    const diffPercent = (pnl / 100000)
    const entryPriceNum = basePrice * (1 + (Math.random() - 0.5) * 0.01)
    const closePriceNum = entryPriceNum * (1 + (sides[Math.floor(Math.random() * 2)] === 'LONG' ? 1 : -1) * diffPercent)
    
    const tradeSide = sides[Math.floor(Math.random() * 2)]
    const tradeInstrument = instruments[i % instruments.length]
    
    const currentSetup = strategies[i % strategies.length]
    const isRuleBroken = Math.random() > 0.9

    return {
      id: `demo-trade-${i}`,
      accountNumber: 'DEMO-123',
      accountId: 'mock-acc-1',
      phaseAccountId: 'mock-acc-1',
      instrument: tradeInstrument,
      side: tradeSide,
      quantity,
      entryPrice: entryPriceNum.toFixed(tradeInstrument === 'XAUUSD' || tradeInstrument === 'NQ100' || tradeInstrument === 'SPX500' ? 2 : 5),
      closePrice: closePriceNum.toFixed(tradeInstrument === 'XAUUSD' || tradeInstrument === 'NQ100' || tradeInstrument === 'SPX500' ? 2 : 5),
      entryPriceValue: entryPriceNum,
      closePriceValue: closePriceNum,
      pnl,
      commission,
      netPnl,
      timeInPosition: durationMin * 60,
      entryDate: entryTime.toISOString(),
      closeDate: exitTime.toISOString(),
      entryTime,
      exitTime,
      status: 'Closed',
      ruleBroken: isRuleBroken,
      selectedRules: [rules[i % rules.length], rules[(i + 1) % rules.length]],
      tags: [tags[i % tags.length]],
      setup: currentSetup,
      tradingModel: currentSetup,
      TradingModel: { id: `tm-${i % strategies.length}`, name: currentSetup }
    }
  })

  // Sort trades chronologically (ascending entryDate) for proper progression/stats
  trades.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())
  return trades
}

function getMockDemoData(): FilteredTradesResponse {
  const mockAccounts = [{
    id: 'mock-acc-1',
    number: 'DEMO-123',
    name: 'Demo Account',
    accountType: 'live' as const,
    startingBalance: 100000,
    balanceToDate: 105432,
    isArchived: false,
    status: 'active'
  }]

  const trades = getMockTradesList()

  // Format calendarData and calculate statistics
  const calendarData = formatCalendarData(trades as any, mockAccounts as any, 'UTC')
  const stats = calculateStatistics(trades as any, mockAccounts as any, undefined, 10)

  // Calculate widgets
  const widgets = {
    equityCurve: calculateEquityCurve(trades as any),
    netDailyPnl: calculateNetDailyPnl(trades as any, 10),
    dailyCumulativePnl: calculateDailyCumulativePnl(trades as any, 10),
    outcomeDistribution: calculateOutcomeDistribution(trades as any, 10),
    dayOfWeekPerformance: calculateDayOfWeekPerformance(trades as any, 10),
    accountBalanceChart: calculateAccountBalanceChart(trades as any, mockAccounts as any, 10),
    pnlByStrategy: calculatePnlByStrategy(trades as any, 10),
    pnlByInstrument: calculatePnlByInstrument(trades as any, 10),
    winRateByStrategy: calculateWinRateByStrategy(trades as any, 10),
    tradeDurationPerformance: calculateTradeDurationPerformance(trades as any, 10),
    weekdayPnl: calculateWeekdayPnl(trades as any, 10),
    performanceScore: calculatePerformanceScoreResult(trades as any, 10),
    sessionAnalysis: calculateSessionAnalysis(trades as any, 10),
    accountProgression: calculateAccountProgression(trades as any, mockAccounts as any, 10),
    tagPerformance: calculateTagPerformance(trades as any, 10),
    timeOfDayPerformance: calculateTimeOfDayPerformance(trades as any, 10),
    disciplineAnalytics: calculateDisciplineAnalytics(trades as any, 10),
    calendarData: calendarData,
    accountBalancePnl: calculateBalanceInfo(mockAccounts as any, trades as any, [], { pnlDisplayMode: 'net' }),
  }

  return {
    trades,
    total: trades.length,
    statistics: stats,
    calendarData,
    widgets
  }
}
