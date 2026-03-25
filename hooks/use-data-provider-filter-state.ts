'use client'

import { useMemo, useState } from 'react'
import { type TradeFilters } from '@/hooks/use-filtered-trades'

export interface DataProviderDateRange {
  from: Date
  to: Date
}

export interface DataProviderPnlRange {
  min: number | undefined
  max: number | undefined
}

export interface DataProviderTimeRange {
  range: string | null
}

export interface DataProviderWeekdayFilter {
  day: number | null
}

export interface DataProviderHourFilter {
  hour: number | null
}

export function useDataProviderFilterState(timezone: string | undefined) {
  const [instruments, setInstruments] = useState<string[]>([])
  const [accountNumbers, setAccountNumbers] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DataProviderDateRange | undefined>(undefined)
  const [pnlRange, setPnlRange] = useState<DataProviderPnlRange>({ min: undefined, max: undefined })
  const [timeRange, setTimeRange] = useState<DataProviderTimeRange>({ range: null })
  const [weekdayFilter, setWeekdayFilter] = useState<DataProviderWeekdayFilter>({ day: null })
  const [hourFilter, setHourFilter] = useState<DataProviderHourFilter>({ hour: null })

  const tradeFilters: TradeFilters = useMemo(() => ({
    accounts: accountNumbers.length > 0 ? accountNumbers : undefined,
    dateFrom: dateRange?.from?.toISOString(),
    dateTo: dateRange?.to?.toISOString(),
    instruments: instruments.length > 0 ? instruments : undefined,
    pnlMin: pnlRange.min,
    pnlMax: pnlRange.max,
    timeRange: timeRange.range,
    weekday: weekdayFilter.day,
    hour: hourFilter.hour,
    limit: 5000,
    includeStats: true,
    includeCalendar: true,
    timezone: timezone || 'UTC',
  }), [accountNumbers, dateRange, instruments, pnlRange, timeRange, weekdayFilter, hourFilter, timezone])

  return {
    instruments,
    setInstruments,
    accountNumbers,
    setAccountNumbers,
    dateRange,
    setDateRange,
    pnlRange,
    setPnlRange,
    timeRange,
    setTimeRange,
    weekdayFilter,
    setWeekdayFilter,
    hourFilter,
    setHourFilter,
    tradeFilters,
  }
}
