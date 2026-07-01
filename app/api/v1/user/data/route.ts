import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { revalidateTag } from 'next/cache'
import { eq, inArray } from 'drizzle-orm'

function isMissingJournalTemplateTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const maybePrismaError = error as {
    code?: string
    meta?: { modelName?: string; table?: string }
  }

  if (maybePrismaError.code !== 'P2021') return false

  return (
    maybePrismaError.meta?.modelName === 'JournalTemplate' ||
    maybePrismaError.meta?.table === 'public.JournalTemplate'
  )
}

export async function DELETE(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const internalUserId = identity.internalUserId

    // Verify confirmation in request body
    const body = await request.json().catch(() => ({}))
    if (body.confirmation !== 'DELETE ALL DATA') {
      return NextResponse.json(
        { success: false, error: 'Confirmation required. Please type "DELETE ALL DATA" to confirm.' },
        { status: 400 }
      )
    }

    // 0. Collect all trade and backtest images for storage cleanup
    const [trades, backtestTrades] = await Promise.all([
      db.query.Trade.findMany({
        where: (table, { eq }) => eq(table.userId, internalUserId),
        columns: {
          imageOne: true, imageTwo: true, imageThree: true,
          imageFour: true, imageFive: true, imageSix: true,
          cardPreviewImage: true
        }
      }),
      db.query.BacktestTrade.findMany({
        where: (table, { eq }) => eq(table.userId, internalUserId),
        columns: {
          imageOne: true, imageTwo: true, imageThree: true,
          imageFour: true, imageFive: true, imageSix: true,
          cardPreviewImage: true
        }
      })
    ])

    const imageUrls = [
      ...trades.flatMap(t => [t.imageOne, t.imageTwo, t.imageThree, t.imageFour, t.imageFive, t.imageSix, t.cardPreviewImage]),
      ...backtestTrades.flatMap(t => [t.imageOne, t.imageTwo, t.imageThree, t.imageFour, t.imageFive, t.imageSix, t.cardPreviewImage])
    ].filter((url): url is string => !!url)

    if (imageUrls.length > 0) {
      try {
        const { deletePublicStorageUrls } = await import('@/server/storage-admin')
        await deletePublicStorageUrls(imageUrls)
      } catch (err) {
        logger.error({ error: err, layer: 'User Data Wipe' }, 'Storage cleanup failed during user data wipe')
      }
    }

    // Delete all user data in a transaction
    // Order matters due to foreign key constraints
    await db.transaction(async (tx) => {
      // 1. Delete all trades
      await tx.delete(schema.Trade).where(eq(schema.Trade.userId, internalUserId))

      // 3. Delete prop firm related data
      // Breach records, daily anchors, payouts (FK to phase accounts)
      const masterAccountIds = await tx.query.MasterAccount.findMany({
        where: (table, { eq }) => eq(table.userId, internalUserId),
        columns: { id: true }
      })
      const masterIds = masterAccountIds.map((m) => m.id)

      if (masterIds.length > 0) {
        // Get phase account IDs
        const phaseAccounts = await tx.query.PhaseAccount.findMany({
          where: (table, { eq, inArray }) => inArray(table.masterAccountId, masterIds),
          columns: { id: true }
        })
        const phaseIds = phaseAccounts.map((p) => p.id)

        if (phaseIds.length > 0) {
          await tx.delete(schema.BreachRecord).where(inArray(schema.BreachRecord.phaseAccountId, phaseIds))
          await tx.delete(schema.DailyAnchor).where(inArray(schema.DailyAnchor.phaseAccountId, phaseIds))
          await tx.delete(schema.Payout).where(inArray(schema.Payout.phaseAccountId, phaseIds))
        }

        // Delete phase accounts
        await tx.delete(schema.PhaseAccount).where(inArray(schema.PhaseAccount.masterAccountId, masterIds))

        // Delete master accounts
        await tx.delete(schema.MasterAccount).where(eq(schema.MasterAccount.userId, internalUserId))
      }

      // 4. Delete live account transactions
      await tx.delete(schema.LiveAccountTransaction).where(eq(schema.LiveAccountTransaction.userId, internalUserId))

      // 5. Delete regular accounts
      await tx.delete(schema.Account).where(eq(schema.Account.userId, internalUserId))

      // 6. Groups removed - no longer used

      // 7. Delete daily notes
      await tx.delete(schema.DailyNote).where(eq(schema.DailyNote.userId, internalUserId))

      // 8. Delete backtest trades
      await tx.delete(schema.BacktestTrade).where(eq(schema.BacktestTrade.userId, internalUserId))

      // 9. Delete tags
      await tx.delete(schema.TradeTag).where(eq(schema.TradeTag.userId, internalUserId))

      // 10. Delete notifications
      await tx.delete(schema.Notification).where(eq(schema.Notification.userId, internalUserId))

      // 11. Delete dashboard templates
      await tx.delete(schema.DashboardTemplate).where(eq(schema.DashboardTemplate.userId, internalUserId))

      // 11b. Delete journal templates
      try {
        await tx.delete(schema.JournalTemplate).where(eq(schema.JournalTemplate.userId, internalUserId))
      } catch (error) {
        if (!isMissingJournalTemplateTableError(error)) {
          throw error
        }
      }

      // 12. Reset user settings (keep account)
      await tx.update(schema.User).set({
        isFirstConnection: true,
      }).where(eq(schema.User.id, internalUserId))

      await tx.insert(schema.UserSettings).values({
        userId: internalUserId,
        accountFilterSettings: null,
      }).onConflictDoUpdate({
        target: schema.UserSettings.userId,
        set: { accountFilterSettings: null }
      })
    })

    // Invalidate all caches (use internal user ID for consistency with other cache keys)
    revalidateTag(`trades-${internalUserId}`)
    revalidateTag(`accounts-${internalUserId}`)
    revalidateTag(`user-data-${internalUserId}`)

    return NextResponse.json({
      success: true,
      message: 'All user data has been permanently deleted. Your account remains active.'
    })

  } catch (error) {
    logger.error({ error, layer: 'User Data Delete' }, 'Delete all user data failed')
    return NextResponse.json(
      { success: false, error: 'Failed to delete data. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}