'use client'

import { useCallback } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import type { Trade as PrismaTrade } from '@prisma/client'
import {
  groupTradesAction,
  ungroupTradesAction,
  updateTradesAction,
  appendTagsToTradesAction,
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
      const updatedCount = await updateTradesAction(tradeIds, update)
      if (updatedCount < tradeIds.length) {
        throw new Error('Trade update did not save. Refresh and try again.')
      }
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

  const appendTagsToTrades = useCallback(async (tradeIds: string[], tagIds: string[]) => {
    if (!userId) return

    const applyTagAppend = (trade: PrismaTrade) => {
      if (!tradeIds.includes(trade.id)) return trade
      const existingTags = Array.isArray(trade.tags) ? trade.tags : []
      const nextTags = Array.from(new Set([...existingTags, ...tagIds]))
      return { ...trade, tags: nextTags }
    }

    const patchCalendarData = (calendarData: any) => {
      if (!calendarData || typeof calendarData !== 'object') return calendarData

      const nextCalendarData: Record<string, any> = { ...calendarData }

      Object.keys(nextCalendarData).forEach((key) => {
        const day = nextCalendarData[key]
        if (!day || !Array.isArray(day.trades)) return
        nextCalendarData[key] = {
          ...day,
          trades: day.trades.map((trade: PrismaTrade) => applyTagAppend(trade)),
        }
      })

      return nextCalendarData
    }

    // Optimistic update
    const updatedTrades = trades.map((trade) => applyTagAppend(trade))
    setTrades(updatedTrades)

    queryClient.setQueriesData({ queryKey: ['v1', 'trades'] }, (oldData: any) => {
      if (!oldData || !Array.isArray(oldData.trades)) return oldData

      return {
        ...oldData,
        trades: oldData.trades.map((trade: PrismaTrade) => applyTagAppend(trade)),
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
      await appendTagsToTradesAction(tradeIds, tagIds)
      await queryClient.invalidateQueries({ queryKey: ['v1', 'trades'] })
    } catch (error) {
      await queryClient.invalidateQueries({ queryKey: ['v1', 'trades'] })
      throw error
    }
  }, [userId, trades, setTrades, queryClient])

  return {
    updateTrades,
    groupTrades,
    ungroupTrades,
    appendTagsToTrades,
  }
}
