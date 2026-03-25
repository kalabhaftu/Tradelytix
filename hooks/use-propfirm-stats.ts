'use client'

import { useQuery } from '@tanstack/react-query'
import type { PropFirmSummaryDTO } from '@/lib/statistics/propfirm-statistics'

export function usePropFirmStats(initialData?: PropFirmSummaryDTO) {
  return useQuery<PropFirmSummaryDTO>({
    queryKey: ['propfirm-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/reports/propfirm')
      if (!res.ok) throw new Error('Failed to fetch prop firm stats')
      return res.json()
    },
    initialData,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
