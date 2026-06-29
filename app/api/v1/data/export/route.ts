import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import archiver from 'archiver'
import { PassThrough } from 'stream'
import { USER_SETTINGS_SELECT, mergeUserSettings } from '@/lib/user-settings'
import { eq, and, or, inArray } from 'drizzle-orm'

// Helper to sanitize and transform data
const sanitizeUser = (data: any) => {
  const { id, userId, auth_user_id, ...rest } = data
  return numberValuesToString(rest)
}

// Convert bigints/decimals to string/number if needed (though simple objects usually fine)
const numberValuesToString = (obj: any) => {
  return obj // Assuming standard JSON safe
}

export async function POST(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const internalUserId = identity.internalUserId

    // Parse Filters
    let filters: { from?: string; to?: string; accountIds?: string[]; instruments?: string[] } = {}
    if (request.headers.get('content-type')?.includes('application/json')) {
      try {
        filters = await request.json()
      } catch (e) {
        logger.warn('Failed to parse export filters', e)
      }
    }

    // Prepare Where Clauses
    const dateFilter = (dateField: string) => {
      if (!filters.from && !filters.to) return {}
      return {
        [dateField]: {
          ...(filters.from ? { gte: new Date(filters.from) } : {}),
          ...(filters.to ? { lte: new Date(filters.to) } : {})
        }
      }
    }

    // Trade Filter: Date + Account
    const tradeWhere: any = {
      userId: internalUserId,
      ...dateFilter('entryDate')
    }

    if (filters.accountIds && filters.accountIds.length > 0) {
      tradeWhere['OR'] = [
        { accountId: { in: filters.accountIds } },
        { phaseAccountId: { in: filters.accountIds } }
      ]
    }

    if (filters.instruments && filters.instruments.length > 0) {
      tradeWhere['instrument'] = { in: filters.instruments }
    }

    // Fetch absolutely everything for this user
    const [
      dbUser,
      accounts,
      masterAccounts,
      tradingModels,
      tradeTags,
      dailyNotes,
      weeklyReviews,
      trades,
      backtestTrades,
      dashboards,
      transactions,
      breachRecords,
      dailyAnchors,
      payouts,
      journalTemplates,
      notifications,
      weeklyAIReviews,
      userGoals,
      sharedReports,
      feedback,
      userGeoLogs,
      promoRedemptions
    ] = await Promise.all([
      db.query.User.findFirst({ 
        where: (table, { eq }) => eq(table.id, internalUserId),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
        with: {
          settings: {
            columns: USER_SETTINGS_SELECT
          }
        }
      } as any),
      db.query.Account.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.MasterAccount.findMany({
        where: (table, { eq }) => eq(table.userId, internalUserId),
        with: { PhaseAccount: true }
      }),
      db.query.TradingModel.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.TradeTag.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.DailyNote.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.WeeklyReview.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.Trade.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.BacktestTrade.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.DashboardTemplate.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.LiveAccountTransaction.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.BreachRecord.findMany({
        where: (table, { eq }) => eq(table.phaseAccountId, internalUserId),
        with: {
          PhaseAccount: {
            columns: {
              phaseId: true,
              phaseNumber: true,
            },
            with: {
              MasterAccount: { columns: { accountName: true } },
            },
          },
        },
      }),
      db.query.DailyAnchor.findMany({
        where: (table, { eq }) => eq(table.phaseAccountId, internalUserId),
        with: {
          PhaseAccount: {
            columns: {
              phaseId: true,
              phaseNumber: true,
            },
            with: {
              MasterAccount: { columns: { accountName: true } },
            },
          },
        },
      }),
      db.query.Payout.findMany({
        where: (table, { eq }) => eq(table.masterAccountId, internalUserId),
        with: {
          MasterAccount: { columns: { accountName: true } },
          PhaseAccount: {
            columns: {
              phaseId: true,
              phaseNumber: true,
            },
            with: {
              MasterAccount: { columns: { accountName: true } },
            },
          },
        },
      }),
      db.query.JournalTemplate.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.Notification.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.WeeklyAIReview.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.UserGoal.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.SharedReport.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.Feedback.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.UserGeoLog.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) }),
      db.query.PromoRedemption.findMany({ where: (table, { eq }) => eq(table.userId, internalUserId) })
    ])

    const modelMap = new Map(
      tradingModels.map((m: typeof tradingModels[number]) => [m.id, m.name])
    )

    const manifest = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      user: dbUser ? mergeUserSettings(dbUser as any, (dbUser as any).settings) : null,
      accounts: accounts.map(sanitizeUser),
      masterAccounts: masterAccounts.map((ma: any) => ({
        ...sanitizeUser(ma),
        PhaseAccount: ma.PhaseAccount.map((p: any) => {
          const { id, masterAccountId, ...rest } = p
          return rest
        }),
      })),
      tradingModels: tradingModels.map(sanitizeUser),
      tradeTags: tradeTags.map(sanitizeUser),
      dailyNotes: dailyNotes.map(sanitizeUser),
      weeklyReviews: weeklyReviews.map(sanitizeUser),
      trades: trades.map((t: any) => {
        const { id, userId, accountId, phaseAccountId, modelId, ...rest } = t
        return {
          ...rest,
          originalId: id,
          modelName: modelId ? modelMap.get(modelId) : null,
        }
      }),
      backtestTrades: backtestTrades.map(sanitizeUser),
      dashboardTemplates: dashboards.map(sanitizeUser),
      liveAccountTransactions: transactions.map(sanitizeUser),
      breachRecords: breachRecords.map((br: any) => {
        const { id, phaseAccountId, PhaseAccount, ...rest } = br
        return {
          ...rest,
          phaseId: PhaseAccount?.phaseId,
          phaseNumber: PhaseAccount?.phaseNumber,
          accountName: PhaseAccount?.MasterAccount?.accountName,
        }
      }),
      dailyAnchors: dailyAnchors.map((da: any) => {
        const { id, phaseAccountId, PhaseAccount, ...rest } = da
        return {
          ...rest,
          phaseId: PhaseAccount?.phaseId,
          phaseNumber: PhaseAccount?.phaseNumber,
          accountName: PhaseAccount?.MasterAccount?.accountName,
        }
      }),
      payouts: payouts.map((p: any) => {
        const { id, masterAccountId, phaseAccountId, MasterAccount, PhaseAccount, ...rest } = p
        return {
          ...rest,
          accountName: MasterAccount?.accountName ?? PhaseAccount?.MasterAccount?.accountName,
          phaseId: PhaseAccount?.phaseId,
          phaseNumber: PhaseAccount?.phaseNumber,
        }
      }),
      journalTemplates: journalTemplates.map(sanitizeUser),
      notifications: notifications.map((notification: any) => {
        const { id, userId, ...rest } = notification
        return rest
      }),
      weeklyAIReviews: weeklyAIReviews.map(sanitizeUser),
      userGoals: userGoals.map(sanitizeUser),
      sharedReports: sharedReports.map((report: any) => {
        const { id, userId, slug, viewCount, lastViewedAt, ...rest } = report
        return rest
      }),
      feedback: feedback.map((item: any) => {
        const { id, userId, email, ipAddress, userAgent, ...rest } = item
        return rest
      }),
      userGeoLogs: userGeoLogs.map((log: any) => {
        const { id, userId, ipAddress, userAgent, ...rest } = log
        return rest
      }),
      promoRedemptions: promoRedemptions.map((redemption: any) => {
        const { id, userId, promoCodeId, ...rest } = redemption
        return rest
      })
    }

    // Set up Archive Stream
    const stream = new PassThrough()
    const archive = archiver('zip', { zlib: { level: 9 } })

    // Log archive warnings/errors
    archive.on('warning', (err) => {
      logger.warn('Archive warning:', err)
    })
    archive.on('error', (err) => {
      logger.error('Archive error:', err)
      stream.destroy(err) // Kill the stream
    })

    // Pipe archive to response stream
    archive.pipe(stream)

    // Execute heavy lifting asynchronously
    const processArchive = async () => {
      try {
        // 1. Add Manifest
        archive.append(JSON.stringify(manifest, null, 2), { name: 'data.json' })

        // 2. Fetch Images
        // Helper to download
        const downloadFile = async (url: string): Promise<Buffer | null> => {
          try {
            const res = await fetch(url)
            if (!res.ok) return null
            return Buffer.from(await res.arrayBuffer())
          } catch (e) {
            return null
          }
        }

        // We process trades in chunks to avoid blowing up memory or connections
        const CHUNK_SIZE = 5
        const allTradesWithImages = trades.filter(
          (t: typeof trades[number]) =>
            t.imageOne ||
            t.imageTwo ||
            t.imageThree ||
            t.imageFour ||
            t.imageFive ||
            t.imageSix ||
            t.cardPreviewImage
        )

        // Helper to process a single trade's images
        const processTradeImages = async (trade: any) => {
          const images = [
            { url: trade.imageOne, suffix: '1' },
            { url: trade.imageTwo, suffix: '2' },
            { url: trade.imageThree, suffix: '3' },
            { url: trade.imageFour, suffix: '4' },
            { url: trade.imageFive, suffix: '5' },
            { url: trade.imageSix, suffix: '6' },
            { url: trade.cardPreviewImage, suffix: 'preview' },
          ]

          for (const img of images) {
            if (img.url && img.url.startsWith('http')) {
              const ext = img.url.split('.').pop()?.split('?')[0] || 'png'
              const buffer = await downloadFile(img.url)
              if (buffer) {
                archive.append(buffer, { name: `images/trades/${trade.id}_${img.suffix}.${ext}` })
              }
            }
          }
        }

        // Chunk processing
        for (let i = 0; i < allTradesWithImages.length; i += CHUNK_SIZE) {
          const chunk = allTradesWithImages.slice(i, i + CHUNK_SIZE)
          await Promise.all(chunk.map(processTradeImages))
          // Small delay to yield event loop if needed?
        }

        // Process Backtest images
        const backtestsWithImages = backtestTrades.filter(
          (t: typeof backtestTrades[number]) =>
            t.imageOne ||
            t.imageTwo ||
            t.imageThree ||
            t.imageFour ||
            t.imageFive ||
            t.imageSix ||
            t.cardPreviewImage
        )
        const processBacktestImages = async (trade: any) => {
          const images = [
            { url: trade.imageOne, suffix: '1' },
            { url: trade.imageTwo, suffix: '2' },
            { url: trade.imageThree, suffix: '3' },
            { url: trade.imageFour, suffix: '4' },
            { url: trade.imageFive, suffix: '5' },
            { url: trade.imageSix, suffix: '6' },
            { url: trade.cardPreviewImage, suffix: 'preview' },
          ]
          for (const img of images) {
            if (img.url && img.url.startsWith('http')) {
              const ext = img.url.split('.').pop()?.split('?')[0] || 'png'
              const buffer = await downloadFile(img.url)
              if (buffer) {
                archive.append(buffer, { name: `images/backtest/${trade.id}_${img.suffix}.${ext}` })
              }
            }
          }
        }

        for (let i = 0; i < backtestsWithImages.length; i += CHUNK_SIZE) {
          const chunk = backtestsWithImages.slice(i, i + CHUNK_SIZE)
          await Promise.all(chunk.map(processBacktestImages))
        }

        await archive.finalize()
      } catch (error) {
        logger.error('Async archive processing error:', error)
        stream.destroy(error as Error)
      }
    }

    // Fire and forget
    processArchive()

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="tradelytix-export-${new Date().toISOString().split('T')[0]}.zip"`
      }
    })

  } catch (error) {
    logger.error('Export init error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}