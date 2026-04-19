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

export function useReportStats(
  filters: UseReportStatsFilters,
  enabled = true,
  options?: UseReportStatsOptions,
) {
  const cleanedFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Record<string, unknown>

  const stableKey = JSON.stringify(cleanedFilters, Object.keys(cleanedFilters).sort())
  const shouldUseInitialData =
    options?.initialData !== undefined &&
    options.initialDataKey !== undefined &&
    options.initialDataKey === stableKey

  return useQuery<ReportStatsResponse>({
    // IMPORTANT: stable key (string), not object reference
    queryKey: ['report-stats', stableKey],
    queryFn: async () => {
      const result = await postFetcher<ReportStatsResponse>('/api/v1/reports/stats', cleanedFilters) as any
      // postFetcher wraps via fetchWithError → { data, error, ok, status }
      // Unwrap the envelope so React Query receives the actual ReportStatsResponse
      if (result?.data !== undefined) return result.data as ReportStatsResponse
      return result as ReportStatsResponse
    },
    enabled,
    initialData: shouldUseInitialData ? options?.initialData : undefined,
    placeholderData: shouldUseInitialData ? options?.initialData : undefined,
    staleTime: 60 * 1000, // Reports data is less volatile, 1 min stale
    gcTime: 5 * 60 * 1000,
  })
}
