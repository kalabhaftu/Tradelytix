'use client'

import { useQuery } from '@tanstack/react-query'

export interface TradingModel {
  id: string
  name: string
  description?: string
  [key: string]: any
}

export interface TradingModelFilters {
  accounts?: string[]
  dateFrom?: string
  dateTo?: string
}

function buildTradingModelQuery(filters?: TradingModelFilters) {
  const params = new URLSearchParams()
  if (filters?.accounts?.length) params.set('accounts', filters.accounts.join(','))
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters?.dateTo) params.set('dateTo', filters.dateTo)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function useTradingModels(filters?: TradingModelFilters) {
  const { data, isLoading, error } = useQuery<TradingModel[] | null>({
    queryKey: ['trading-models', filters ?? {}],
    queryFn: async () => {
      const response = await fetch(`/api/v1/user/trading-models${buildTradingModelQuery(filters)}`)
      if (!response.ok) throw new Error('Failed to fetch trading models')
      const data = await response.json()
      // API shape: { success: true, models: [...] }
      if (Array.isArray(data)) return data
      if (Array.isArray(data?.models)) return data.models
      if (Array.isArray(data?.tradingModels)) return data.tradingModels
      return []
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const tradingModels = Array.isArray(data) ? data : []

  return { tradingModels, isLoading, error }
}
