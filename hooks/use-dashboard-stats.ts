'use client'

import { useQuery } from '@tanstack/react-query'
import { AccountFilterSettings, DEFAULT_FILTER_SETTINGS } from '@/types/account-filter-settings'

interface DashboardStats {
  totalAccounts: number
  totalTrades: number
  totalEquity: number
  totalPnL: number
  winRate: number
  profitFactor?: number
  grossProfits?: number
  grossLosses?: number
  winningTrades?: number
  losingTrades?: number
  breakEvenTrades?: number
  chartData: Array<{ date: string; pnl: number }>
  isAuthenticated: boolean
  lastUpdated: string
}

interface UseDashboardStatsResult {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboardStats(settings: AccountFilterSettings = DEFAULT_FILTER_SETTINGS): UseDashboardStatsResult {
  // Build URL with phase filter params
  const params = new URLSearchParams()
  if (settings.viewingSpecificPhase && settings.selectedMasterAccountId) {
    params.append('masterAccountId', settings.selectedMasterAccountId)
    if (settings.selectedPhaseId) {
      params.append('phaseId', settings.selectedPhaseId)
    }
    if (settings.selectedPhaseNumber) {
      params.append('phaseNumber', settings.selectedPhaseNumber.toString())
    }
  }
  params.append('includeWidgets', 'true')
  const url = `/api/v1/trades?${params.toString()}`
  
  // Build stable query key from settings
  const queryKey = [
    'dashboard-stats',
    settings.viewingSpecificPhase,
    settings.selectedMasterAccountId,
    settings.selectedPhaseId,
    settings.selectedPhaseNumber
  ]

  const { data, isLoading, error: queryError, refetch } = useQuery<DashboardStats>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      const result = await response.json()
      const stats = result.statistics || {}
      const accountBalance = result.widgets?.accountBalancePnl || {}
      const chartData = Array.isArray(result.widgets?.netDailyPnl) ? result.widgets.netDailyPnl : []

      return {
        totalAccounts: Array.isArray(result.widgets?.accountBalanceChart) ? result.widgets.accountBalanceChart.length : 0,
        totalTrades: stats.nbTrades ?? 0,
        totalEquity: accountBalance.currentBalance || 0,
        totalPnL: stats.totalPnL || accountBalance.netPnL || 0,
        winRate: stats.winRate || 0,
        profitFactor: stats.profitFactor || 0,
        grossProfits: stats.grossWin || 0,
        grossLosses: stats.grossLosses || 0,
        winningTrades: stats.nbWin || 0,
        losingTrades: stats.nbLoss || 0,
        breakEvenTrades: stats.nbBe || 0,
        chartData,
        isAuthenticated: true,
        lastUpdated: new Date().toISOString()
      }
    },
    staleTime: 30 * 1000, // 30s
    gcTime: 5 * 60 * 1000,
  })

  return {
    stats: data ?? null,
    loading: isLoading,
    error: queryError?.message || null,
    refetch: async () => { await refetch() }
  }
}
