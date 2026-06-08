/**
 * User Data Management API
 * DELETE /api/user/data - Delete all user data (keeps account intact)
 * 
 * This deletes all user DATA but keeps the user account.
 * For complete account deletion, use /api/user/account endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { revalidateTag } from 'next/cache'

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
      prisma.trade.findMany({
        where: { userId: internalUserId },
        select: {
          imageOne: true, imageTwo: true, imageThree: true,
          imageFour: true, imageFive: true, imageSix: true,
          cardPreviewImage: true
        }
      }),
      prisma.backtestTrade.findMany({
        where: { userId: internalUserId },
        select: {
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
        logger.error('Storage cleanup failed during user data wipe', err, 'User Data Wipe')
      }
    }

    // Delete all user data in a transaction
    // Order matters due to foreign key constraints
    await prisma.$transaction(async (tx) => {
      // 1. Delete all trades
      await tx.trade.deleteMany({
        where: { userId: internalUserId }
      })

      // 3. Delete prop firm related data
      // Breach records, daily anchors, payouts (FK to phase accounts)
      const masterAccountIds = await tx.masterAccount.findMany({
        where: { userId: internalUserId },
        select: { id: true }
      })
      const masterIds = masterAccountIds.map((m: typeof masterAccountIds[number]) => m.id)

      if (masterIds.length > 0) {
        // Get phase account IDs
        const phaseAccounts = await tx.phaseAccount.findMany({
          where: { masterAccountId: { in: masterIds } },
          select: { id: true }
        })
        const phaseIds = phaseAccounts.map((p: typeof phaseAccounts[number]) => p.id)

        if (phaseIds.length > 0) {
          await tx.breachRecord.deleteMany({
            where: { phaseAccountId: { in: phaseIds } }
          })
          await tx.dailyAnchor.deleteMany({
            where: { phaseAccountId: { in: phaseIds } }
          })
          await tx.payout.deleteMany({
            where: { phaseAccountId: { in: phaseIds } }
          })
        }

        // Delete phase accounts
        await tx.phaseAccount.deleteMany({
          where: { masterAccountId: { in: masterIds } }
        })

        // Delete master accounts
        await tx.masterAccount.deleteMany({
          where: { userId: internalUserId }
        })
      }

      // 4. Delete live account transactions
      await tx.liveAccountTransaction.deleteMany({
        where: { userId: internalUserId }
      })

      // 5. Delete regular accounts
      await tx.account.deleteMany({
        where: { userId: internalUserId }
      })

      // 6. Groups removed - no longer used

      // 7. Delete daily notes
      await tx.dailyNote.deleteMany({
        where: { userId: internalUserId }
      })

      // 8. Delete backtest trades
      await tx.backtestTrade.deleteMany({
        where: { userId: internalUserId }
      })

      // 9. Delete tags
      await tx.tradeTag.deleteMany({
        where: { userId: internalUserId }
      })

      // 10. Delete notifications
      await tx.notification.deleteMany({
        where: { userId: internalUserId }
      })

      // 11. Delete dashboard templates
      await tx.dashboardTemplate.deleteMany({
        where: { userId: internalUserId }
      })

      // 11b. Delete journal templates
      try {
        await tx.journalTemplate.deleteMany({
          where: { userId: internalUserId }
        })
      } catch (error) {
        if (!isMissingJournalTemplateTableError(error)) {
          throw error
        }
      }

      // 12. Reset user settings (keep account)
      await tx.user.update({
        where: { id: internalUserId },
        data: {
          isFirstConnection: true,
        }
      })

      await tx.userSettings.upsert({
        where: { userId: internalUserId },
        create: {
          userId: internalUserId,
          accountFilterSettings: null,
        },
        update: {
          accountFilterSettings: null,
        }
      })
    }, {
      timeout: 60000, // 60 second timeout for large deletions
      maxWait: 65000
    })

    // Invalidate all caches (use internal user ID for consistency with other cache keys)
    revalidateTag(`trades-${internalUserId}`, 'max')
    revalidateTag(`accounts-${internalUserId}`, 'max')
    revalidateTag(`user-data-${internalUserId}`, 'max')

    return NextResponse.json({
      success: true,
      message: 'All user data has been permanently deleted. Your account remains active.'
    })

  } catch (error) {
    logger.error('Delete all user data failed', error, 'User Data Delete')
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

