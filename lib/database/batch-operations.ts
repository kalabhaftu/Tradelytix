/**
 * Batched Database Operations
 * 
 * Provides utilities for efficient batch operations
 * Reduces database round trips and improves performance
 */

import { db } from '@/lib/db/client'
import { Trade, TradeExecution, Account } from '@/lib/db/schema'
import { inArray, gte, lte, and, eq, sql, gt, lt, count, sum, avg } from 'drizzle-orm'
import type { TradeType } from '@/lib/db/schema/trades';
import type { AccountType } from '@/lib/db/schema/accounts';

import { buildSyntheticExecutionsFromTrade, buildTradePersistenceData } from '@/lib/trade-core'
import { deletePublicStorageUrls } from '@/server/storage-admin'
import logger from '@/lib/logger';

/**
 * Batch create trades with transaction
 * More efficient than creating one-by-one
 */
export async function batchCreateTrades(
  trades: any[]
): Promise<{ count: number; errors: any[] }> {
  const errors: any[] = []
  let count = 0

  try {
    const preparedTrades = trades.map((trade) =>
      buildTradePersistenceData({
        id: trade.id || crypto.randomUUID(),
        ...trade,
      })
    )
    // Use createMany for bulk insert (much faster)
    await db.insert(Trade).values(preparedTrades as any).onConflictDoNothing()

    await db.insert(TradeExecution).values(
      preparedTrades.flatMap((trade: any) => buildSyntheticExecutionsFromTrade(trade)) as any
    ).onConflictDoNothing()
    
    count = preparedTrades.length
  } catch (error) {
    errors.push(error)
  }

  return { count, errors }
}

/**
 * Batch update trades with transaction
 */
export async function batchUpdateTrades(
  updates: { id: string; data: any }[]
): Promise<{ count: number; errors: any[] }> {
  const errors: any[] = []
  let count = 0

  try {
    // Use transaction for atomic updates
    await db.transaction(async (tx) => {
      for (const { id, data } of updates) {
        await tx.update(Trade).set(data).where(eq(Trade.id, id))
      }
    })
    
    count = updates.length
  } catch (error) {
    errors.push(error)
  }

  return { count, errors }
}

/**
 * Batch delete trades with transaction
 */
export async function batchDeleteTrades(
  tradeIds: string[],
  userId: string
): Promise<{ count: number; errors: any[] }> {
  const errors: any[] = []
  let count = 0

  try {
    // 1. Fetch image URLs for these trades
    const tradesWithImages = await db.select({
      imageOne: Trade.imageOne,
      imageTwo: Trade.imageTwo,
      imageThree: Trade.imageThree,
      imageFour: Trade.imageFour,
      imageFive: Trade.imageFive,
      imageSix: Trade.imageSix,
      cardPreviewImage: Trade.cardPreviewImage
    })
      .from(Trade)
      .where(and(inArray(Trade.id, tradeIds), eq(Trade.userId, userId)))

    const imageUrls = tradesWithImages.flatMap(trade => [
      trade.imageOne,
      trade.imageTwo,
      trade.imageThree,
      trade.imageFour,
      trade.imageFive,
      trade.imageSix,
      trade.cardPreviewImage
    ]).filter((url): url is string => !!url)

    // 2. Delete from storage
    if (imageUrls.length > 0) {
      try {
        await deletePublicStorageUrls(imageUrls)
      } catch (error) {
        logger.error('[Batch Delete Trades] Storage deletion failed:', error)
      }
    }

    // 3. Use delete for bulk delete with user filtering for security
    await db.delete(Trade).where(and(
      inArray(Trade.id, tradeIds),
      eq(Trade.userId, userId) // CRITICAL: Ensure user can only delete their own trades
    ))
    
    count = tradeIds.length
  } catch (error) {
    errors.push(error)
  }

  return { count, errors }
}

/**
 * Fetch multiple accounts in parallel
 */
export async function fetchAccountsInParallel(
  userId: string,
  accountIds: string[]
): Promise<AccountType[]> {
  try {
    const accounts = await db.select()
      .from(Account)
      .where(and(
        eq(Account.userId, userId),
        inArray(Account.id, accountIds)
      ))
    
    return accounts
  } catch (error) {
    return []
  }
}

/**
 * Fetch trades with related data in a single query (avoid N+1)
 */
export async function fetchTradesWithRelations(
  userId: string,
  options?: {
    limit?: number
    accountIds?: string[]
    startDate?: Date
    endDate?: Date
  }
): Promise<TradeType[]> {
  try {
    const { limit = 1000, accountIds, startDate, endDate } = options || {}

    const trades = await db.query.Trade.findMany({
      where: (trade, { eq, and, inArray, gte, lte }) => {
        const conditions = [eq(trade.userId, userId)]
        if (accountIds && accountIds.length > 0) conditions.push(inArray(trade.accountId, accountIds))
        if (startDate) conditions.push(gte(trade.entryTime, startDate))
        if (endDate) conditions.push(lte(trade.entryTime, endDate))
        return and(...conditions)
      },
      orderBy: (trade, { desc }) => [desc(trade.entryTime)],
      limit: limit,
      with: {
        Account: true,
        PhaseAccount: true,
      },
    })
    
    return trades as any
  } catch (error) {
    return []
  }
}

/**
 * Batch upsert (create or update) trades
 */
export async function batchUpsertTrades(
  trades: (any & { entryId?: string })[]
): Promise<{ created: number; updated: number; errors: any[] }> {
  const errors: any[] = []
  let created = 0
  let updated = 0

  try {
    const results = await db.transaction(async (tx) => {
      return await Promise.all(trades.map(async (trade) => {
        const preparedTrade = buildTradePersistenceData({
          id: trade.id || crypto.randomUUID(),
          ...trade,
        })
        return await tx.insert(Trade).values(preparedTrade as any)
          .onConflictDoUpdate({
            target: Trade.id,
            set: preparedTrade as any
          })
      }))
    })
    
    // Count creates vs updates (this is approximate)
    created = results.length
  } catch (error) {
    errors.push(error)
  }

  return { created, updated, errors }
}

/**
 * Optimized dashboard stats query (single query instead of multiple)
 */
export async function fetchDashboardStats(
  userId: string,
  accountIds?: string[]
) {
  try {
    const statsResult = await db.select({
      countId: count(Trade.id),
      sumPnl: sum(Trade.pnl),
      sumCommission: sum(Trade.commission),
      avgPnl: avg(Trade.pnl),
    }).from(Trade).where(and(
      eq(Trade.userId, userId),
      accountIds && accountIds.length > 0 ? inArray(Trade.accountId, accountIds) : undefined
    ))

    const stats = statsResult[0]

    const [winCountResult, lossCountResult] = await Promise.all([
      db.select({ count: count() }).from(Trade).where(and(
        eq(Trade.userId, userId),
        gt(Trade.pnl, 0),
        accountIds && accountIds.length > 0 ? inArray(Trade.accountId, accountIds) : undefined
      )),
      db.select({ count: count() }).from(Trade).where(and(
        eq(Trade.userId, userId),
        lt(Trade.pnl, 0),
        accountIds && accountIds.length > 0 ? inArray(Trade.accountId, accountIds) : undefined
      )),
    ])

    const winCount = winCountResult[0]?.count ?? 0
    const lossCount = lossCountResult[0]?.count ?? 0
    const totalTrades = stats?.countId ?? 0

    return {
      totalTrades: totalTrades,
      totalPnl: Number(stats?.sumPnl) || 0,
      totalCommission: Number(stats?.sumCommission) || 0,
      avgPnl: Number(stats?.avgPnl) || 0,
      winCount,
      lossCount,
      winRate: totalTrades > 0 ? (winCount / totalTrades) * 100 : 0,
    }
  } catch (error) {
    return null
  }
}

