import useSWR from 'swr'
import { Trade } from '@prisma/client'
import { useData } from '@/context/data-provider'
import { getMockTradesList } from './use-filtered-trades'
import { calculateStatistics } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export interface UseJournalParams {
  page?: number
  limit?: number
  search?: string
  tradeDate?: string
  filterBy?: 'all' | 'wins' | 'losses' | 'breakeven' | 'buys' | 'sells'
  selectedTagIds?: string[]
  accountNumbers?: string[]
}

export function useJournal(params: UseJournalParams) {
  const {
    page = 1,
    limit = 21, // ITEMS_PER_PAGE in journal-client
    search = '',
    tradeDate = '',
    filterBy = 'all',
    selectedTagIds = [],
    accountNumbers = []
  } = params

  const dataContext = useData()
  const isDemoMode = !!dataContext?.isDemoMode

  if (isDemoMode) {
    let mockTrades = getMockTradesList()

    // Filter by date
    if (tradeDate) {
      mockTrades = mockTrades.filter(t => t.entryDate.startsWith(tradeDate))
    }

    // Filter by outcome / side
    if (filterBy === 'wins') {
      mockTrades = mockTrades.filter(t => t.pnl > 10)
    } else if (filterBy === 'losses') {
      mockTrades = mockTrades.filter(t => t.pnl < -10)
    } else if (filterBy === 'breakeven') {
      mockTrades = mockTrades.filter(t => t.pnl >= -10 && t.pnl <= 10)
    } else if (filterBy === 'buys') {
      mockTrades = mockTrades.filter(t => t.side === 'LONG' || t.side === 'Buy')
    } else if (filterBy === 'sells') {
      mockTrades = mockTrades.filter(t => t.side === 'SHORT' || t.side === 'Sell')
    }

    // Filter by tags
    if (selectedTagIds.length > 0) {
      mockTrades = mockTrades.filter(t => t.tags.some(tag => selectedTagIds.includes(tag)))
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      mockTrades = mockTrades.filter((t: any) => 
        t.instrument.toLowerCase().includes(searchLower) ||
        (t.setup && t.setup.toLowerCase().includes(searchLower)) ||
        (t.comment && t.comment.toLowerCase().includes(searchLower))
      )
    }

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

    mockTrades.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())
    const stats = calculateStatistics(mockTrades as any, mockAccounts as any, undefined, 10)

    const offset = (page - 1) * limit
    const paginated = mockTrades.slice(offset, offset + limit)

    return {
      trades: paginated as any[],
      totalCount: mockTrades.length,
      statistics: stats,
      isLoading: false,
      isError: null,
      refetch: async () => {}
    }
  }

  const queryParams = new URLSearchParams()
  const normalizedSearch = search.trim()
  const exactDateMatch = normalizedSearch.match(/^(\d{4}-\d{2}-\d{2})$/)
  const normalizedTradeDate = tradeDate.trim()
  
  // Pagination via offset since /v1/trades leverages pageLimit & pageOffset
  queryParams.append('pageLimit', limit.toString())
  queryParams.append('pageOffset', ((page - 1) * limit).toString())
  
  // Search
  if (normalizedTradeDate) {
    queryParams.append('tradeDate', normalizedTradeDate)
  } else if (exactDateMatch) {
    queryParams.append('tradeDate', exactDateMatch[1])
  } else if (normalizedSearch) {
    queryParams.append('search', normalizedSearch)
  }
  
  // Win/Loss
  if (filterBy === 'wins') {
    queryParams.append('outcome', 'win')
  } else if (filterBy === 'losses') {
    queryParams.append('outcome', 'loss')
  } else if (filterBy === 'breakeven') {
    queryParams.append('outcome', 'breakeven')
  }

  // Buy/Sell
  if (filterBy === 'buys') {
    queryParams.append('side', 'BUY')
  } else if (filterBy === 'sells') {
    queryParams.append('side', 'SELL')
  }

  // Tags
  if (selectedTagIds.length > 0) {
    queryParams.append('tags', selectedTagIds.join(','))
  }

  // Global Accounts Filter
  if (accountNumbers.length > 0) {
    queryParams.append('accounts', accountNumbers.join(','))
  }

  // Only ask for trade array, no need to recalc huge stats arrays if the Journal doesn't use all of them
  // Actually Journal uses its own stats logic locally but to do that we need the aggregated stats from backend
  // because we are lazy loading! Let's request includeStats=true
  queryParams.append('includeStats', 'true')
  queryParams.append('includeCalendar', 'false')
  queryParams.append('groupByExecution', 'true')

  const url = `/api/v1/trades?${queryParams.toString()}`

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    keepPreviousData: true,
  })

  return {
    trades: (data?.trades as Trade[]) || [],
    totalCount: data?.total || 0,
    statistics: data?.statistics || null,
    isLoading,
    isError: error,
    refetch: mutate
  }
}
