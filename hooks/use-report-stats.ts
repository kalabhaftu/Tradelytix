/**
 * React Query hook for report statistics
 * 
 * Replaces the 4 useMemo blocks in reports/page.tsx with a single
 * server-side computed response via /api/v1/reports/stats
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { postFetcher } from '@/lib/query/fetcher'
import type { ReportStatsResponse } from '@/lib/statistics/report-statistics'
import { useUserStore } from '@/store/user-store'

export interface UseReportStatsFilters {
  accountId?: string
  dateFrom?: string
  dateTo?: string
  symbol?: string
  session?: string
  outcome?: string
  strategy?: string
  ruleBroken?: string
}

interface UseReportStatsOptions {
  initialData?: ReportStatsResponse
  initialDataKey?: string
}

const COLORS = {
  bullish: 'green',
  bearish: 'red',
}

function getMockReportStats(): ReportStatsResponse {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const equityCurve = []
  let currentBalance = 100000
  equityCurve.push({ date: new Date(year, month, 1).toLocaleDateString(), balance: currentBalance, pnl: 0 })
  for (let i = 2; i <= 28; i++) {
    const isWin = Math.random() > 0.45
    const pnl = isWin ? Math.floor(150 + Math.random() * 800) : -Math.floor(100 + Math.random() * 350)
    currentBalance += pnl
    equityCurve.push({
      date: new Date(year, month, i).toLocaleDateString(),
      balance: currentBalance,
      pnl: pnl
    })
  }

  return {
    tradingActivity: {
      totalTrades: 80,
      winRate: '55.0',
      avgTradesPerMonth: 80,
      tradingDaysActive: 20,
      mostTradedDay: 'Tuesday',
      mostProfitableDay: 'Wednesday',
      mostProfitablePair: 'NQ100',
      mostLosingDay: 'Friday',
      mostLosingPair: 'EURUSD'
    },
    psychMetrics: {
      longestWinStreak: 8,
      longestLoseStreak: 4,
      avgWin: '450.00',
      avgLoss: '-220.00',
      totalNetPnL: 5432,
      expectancy: '67.90',
      profitFactor: '1.58',
      avgHoldingTime: '2h 15m',
      maxDrawdown: '1.20%',
      peakEquity: '106200.00',
      rrEfficiency: '75%',
      consistencyScore: '82%',
      recoveryFactor: '4.53',
      totalRMultiple: '12.4R',
      sharpeRatio: '2.10',
      sortinoRatio: '3.45',
      calmarRatio: '4.50'
    },
    sessionPerformance: {
      'New York': {
        name: 'New York',
        range: '13:00 - 22:00 UTC',
        trades: 45,
        wins: 26,
        pnl: 3850,
        totalHoldMs: 45 * 2.2 * 60 * 60 * 1000,
        peak: 4200,
        maxDD: 850
      },
      'London': {
        name: 'London',
        range: '08:00 - 17:00 UTC',
        trades: 25,
        wins: 14,
        pnl: 1820,
        totalHoldMs: 25 * 1.8 * 60 * 60 * 1000,
        peak: 2100,
        maxDD: 450
      },
      'Asia': {
        name: 'Asia',
        range: '00:00 - 09:00 UTC',
        trades: 10,
        wins: 4,
        pnl: -238,
        totalHoldMs: 10 * 3.5 * 60 * 60 * 1000,
        peak: 150,
        maxDD: 500
      }
    },
    rMultipleDistribution: {
      '<-1R': 2,
      '-1R to 0R': 34,
      '0R to 1R': 5,
      '1R to 2R': 22,
      '2R to 3R': 12,
      '>3R': 5
    },
    rMultipleDataQuality: {
      totalTrades: 80,
      tradesWithStopLoss: 78,
      percentageComplete: 97.5
    },
    chartData: {
      equityCurve: equityCurve,
      outcomeDistribution: [
        { name: 'Wins', value: 44, color: COLORS.bullish },
        { name: 'Losses', value: 36, color: COLORS.bearish }
      ],
      dayOfWeekPerformance: [
        { name: 'Mon', pnl: 450 },
        { name: 'Tue', pnl: 1200 },
        { name: 'Wed', pnl: 2150 },
        { name: 'Thu', pnl: 1850 },
        { name: 'Fri', pnl: -218 }
      ]
    },
    filteredTrades: [],
    filterOptions: {
      symbols: ['EURUSD', 'NQ100', 'XAUUSD', 'GBPUSD', 'SPX500'],
      sessions: ['New York', 'London', 'Asia'],
      outcomes: [
        { value: 'WIN', label: 'Win' },
        { value: 'LOSS', label: 'Loss' },
        { value: 'BREAKEVEN', label: 'Breakeven' }
      ],
      strategies: [
        { id: 'tm-1', name: 'EMA Cross' },
        { id: 'tm-2', name: 'ICT Silver Bullet' },
        { id: 'tm-3', name: 'SMT Divergence' },
        { id: 'tm-4', name: 'Liquidity Sweep' },
        { id: 'tm-5', name: 'Order Block' }
      ]
    }
  }
}

export function useReportStats(
  filters: UseReportStatsFilters,
  enabled = true,
  options?: UseReportStatsOptions,
) {
  const user = useUserStore(state => state.user)
  const isDemo = user?.id === 'demo-user'

  const cleanedFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Record<string, unknown>

  const stableKey = JSON.stringify(cleanedFilters, Object.keys(cleanedFilters).sort())
  const shouldUseInitialData =
    options?.initialData !== undefined &&
    options.initialDataKey !== undefined &&
    options.initialDataKey === stableKey

  return useQuery<ReportStatsResponse>({
    queryKey: ['report-stats', stableKey, isDemo],
    queryFn: async () => {
      if (isDemo) {
        return getMockReportStats()
      }
      const result = await postFetcher<ReportStatsResponse>('/api/v1/reports/stats', cleanedFilters) as any
      if (result?.data !== undefined) return result.data as ReportStatsResponse
      return result as ReportStatsResponse
    },
    enabled,
    initialData: shouldUseInitialData ? options?.initialData : undefined,
    placeholderData: shouldUseInitialData ? options?.initialData : undefined,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
