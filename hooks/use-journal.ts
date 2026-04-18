import useSWR from 'swr'
import { Trade } from '@prisma/client'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export interface UseJournalParams {
  page?: number
  limit?: number
  search?: string
  filterBy?: 'all' | 'wins' | 'losses' | 'buys' | 'sells'
  selectedTagIds?: string[]
  accountNumbers?: string[]
}

export function useJournal(params: UseJournalParams) {
  const {
    page = 1,
    limit = 21, // ITEMS_PER_PAGE in journal-client
    search = '',
    filterBy = 'all',
    selectedTagIds = [],
    accountNumbers = []
  } = params

  const queryParams = new URLSearchParams()
  
  // Pagination via offset since /v1/trades leverages pageLimit & pageOffset
  queryParams.append('pageLimit', limit.toString())
  queryParams.append('pageOffset', ((page - 1) * limit).toString())
  
  // Search
  if (search) queryParams.append('search', search)
  
  // Win/Loss
  if (filterBy === 'wins') {
    queryParams.append('outcome', 'win')
  } else if (filterBy === 'losses') {
    queryParams.append('outcome', 'loss')
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
