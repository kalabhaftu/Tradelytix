'use client'

import { useCallback } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import type { Trade as PrismaTrade } from '@prisma/client'
import {
  groupTradesAction,
  ungroupTradesAction,
  updateTradesAction,
} from '@/server/database'

interface UseDataProviderTradeMutationsParams {
  userId: string | undefined
  trades: PrismaTrade[]
  setTrades: (trades: PrismaTrade[]) => void
  queryClient: QueryClient
}

export function useDataProviderTradeMutations({
  userId,
  trades,
  setTrades,
  queryClient,
}: UseDataProviderTradeMutationsParams) {
  const updateTrades = useCallback(async (tradeIds: string[], update: Partial<PrismaTrade>) => {
    if (!userId) return

    const applyTradePatch = (trade: PrismaTrade) =>
      tradeIds.includes(trade.id) ? { ...trade, ...update } : trade

    const patchCalendarData = (calendarData: any) => {
      if (!calendarData || typeof calendarData !== 'object') return calendarData

      const nextCalendarData: Record<string, any> = { ...calendarData }

      Object.keys(nextCalendarData).forEach((key) => {
        const day = nextCalendarData[key]
        if (!day || !Array.isArray(day.trades)) return
        nextCalendarData[key] = {
          ...day,
          trades: day.trades.map((trade: PrismaTrade) => applyTradePatch(trade)),
        }
      })

      return nextCalendarData
    }

    const updatedTrades = trades.map((trade) => applyTradePatch(trade))
    setTrades(updatedTrades)

    queryClient.setQueriesData({ queryKey: ['v1', 'trades'] }, (oldData: any) => {
      if (!oldData || !Array.isArray(oldData.trades)) return oldData

      return {
        ...oldData,
        trades: oldData.trades.map((trade: PrismaTrade) => applyTradePatch(trade)),
        calendarData: patchCalendarData(oldData.calendarData),
        widgets: oldData.widgets
          ? {
              ...oldData.widgets,
              calendarData: patchCalendarData(oldData.widgets.calendarData),
            }
          : oldData.widgets,
      }
    })

    try {
      await updateTradesAction(tradeIds, update)
      await queryClient.invalidateQueries({ queryKey: ['v1', 'trades'] })
    } catch (error) {
      await queryClient.invalidateQueries({ queryKey: ['v1', 'trades'] })
      throw error
    }
  }, [userId, trades, setTrades, queryClient])

  const groupTrades = useCallback(async (tradeIds: string[]) => {
    if (!userId) return

    setTrades(trades.map((trade) =>
      tradeIds.includes(trade.id)
        ? { ...trade, groupId: tradeIds[0] }
        : trade
    ))

    await groupTradesAction(tradeIds)
  }, [userId, trades, setTrades])

  const ungroupTrades = useCallback(async (tradeIds: string[]) => {
    if (!userId) return

    setTrades(trades.map((trade) =>
      tradeIds.includes(trade.id)
        ? { ...trade, groupId: null }
        : trade
    ))

    await ungroupTradesAction(tradeIds)
  }, [userId, trades, setTrades])

  return {
    updateTrades,
    groupTrades,
    ungroupTrades,
  }
}
