import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '@/store/user-store'

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
  const user = useUserStore(state => state.user)
  const isDemo = user?.id === 'demo-user'

  const { data, isLoading, error } = useQuery<TradingModel[] | null>({
    queryKey: ['trading-models', filters ?? {}, isDemo],
    queryFn: async () => {
      if (isDemo) {
        return [
          { id: 'tm-1', name: 'EMA Cross', description: 'Exponential Moving Average crossover strategy' },
          { id: 'tm-2', name: 'ICT Silver Bullet', description: 'ICT Silver Bullet strategy' },
          { id: 'tm-3', name: 'SMT Divergence', description: 'Smart Money Tool divergence strategy' },
          { id: 'tm-4', name: 'Liquidity Sweep', description: 'Liquidity sweep and market structure shift' },
          { id: 'tm-5', name: 'Order Block', description: 'Trading off supply/demand order blocks' }
        ]
      }
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
