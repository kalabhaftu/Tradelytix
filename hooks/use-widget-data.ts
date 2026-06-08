'use client'

import { useData } from '@/context/data-provider'

/**
 * Hook for widget chart data.
 *
 * Reads pre-computed chart data from the /api/v1/trades response
 * (included in the `widgets` field) via the DataProvider context.
 *
 * This eliminates 6 separate /api/v1/dashboard/widgets API calls
 * that each re-ran the entire trades query.
 */
export function useWidgetData(type: string) {
  const { widgetData, error } = useData()

  return {
    data: widgetData?.[type] ?? [],
    isLoading: widgetData === null && !error,
    error: error ?? null
  }
}
