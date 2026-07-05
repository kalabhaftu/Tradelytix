import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { eq, inArray } from 'drizzle-orm'
import { getSupabaseAdminClient } from '@/server/supabase-admin'

export async function DELETE(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { internalUserId, authUserId } = identity

    // 1. Delete all user data in a transaction
    await db.transaction(async (tx) => {
      // Trades and related
      const trades = await tx.query.Trade.findMany({
        where: (table, { eq }) => eq(table.userId, internalUserId),
        columns: { id: true }
      })
      const tradeIds = trades.map(t => t.id)
      
      if (tradeIds.length > 0) {
        await tx.delete(schema.TradeExecution).where(inArray(schema.TradeExecution.tradeId, tradeIds))
      }
      
      await tx.delete(schema.Trade).where(eq(schema.Trade.userId, internalUserId))
      await tx.delete(schema.TradeTag).where(eq(schema.TradeTag.userId, internalUserId))
      await tx.delete(schema.BacktestTrade).where(eq(schema.BacktestTrade.userId, internalUserId))

      // Accounts
      await tx.delete(schema.LiveAccountTransaction).where(eq(schema.LiveAccountTransaction.userId, internalUserId))
      await tx.delete(schema.Account).where(eq(schema.Account.userId, internalUserId))
      
      const masterAccounts = await tx.query.MasterAccount.findMany({
        where: (table, { eq }) => eq(table.userId, internalUserId),
        columns: { id: true }
      })
      const masterAccountIds = masterAccounts.map(m => m.id)

      if (masterAccountIds.length > 0) {
        const phaseAccounts = await tx.query.PhaseAccount.findMany({
          where: (table, { inArray }) => inArray(table.masterAccountId, masterAccountIds),
          columns: { id: true }
        })
        const phaseAccountIds = phaseAccounts.map(p => p.id)

        if (phaseAccountIds.length > 0) {
          await tx.delete(schema.BreachRecord).where(inArray(schema.BreachRecord.phaseAccountId, phaseAccountIds))
          await tx.delete(schema.DailyAnchor).where(inArray(schema.DailyAnchor.phaseAccountId, phaseAccountIds))
          await tx.delete(schema.Payout).where(inArray(schema.Payout.phaseAccountId, phaseAccountIds))
          await tx.delete(schema.PhaseAccount).where(inArray(schema.PhaseAccount.id, phaseAccountIds))
        }

        await tx.delete(schema.Payout).where(inArray(schema.Payout.masterAccountId, masterAccountIds))
        await tx.delete(schema.MasterAccount).where(inArray(schema.MasterAccount.id, masterAccountIds))
      }
      
      // Journaling & Tracking
      await tx.delete(schema.DailyNote).where(eq(schema.DailyNote.userId, internalUserId))
      await tx.delete(schema.WeeklyReview).where(eq(schema.WeeklyReview.userId, internalUserId))
      await tx.delete(schema.JournalTemplate).where(eq(schema.JournalTemplate.userId, internalUserId))
      await tx.delete(schema.TradingModel).where(eq(schema.TradingModel.userId, internalUserId))
      await tx.delete(schema.ActivityLog).where(eq(schema.ActivityLog.userId, internalUserId))
      await tx.delete(schema.UserGoal).where(eq(schema.UserGoal.userId, internalUserId))
      
      // AI & Dashboard
      await tx.delete(schema.DashboardTemplate).where(eq(schema.DashboardTemplate.userId, internalUserId))
      await tx.delete(schema.WeeklyAIReview).where(eq(schema.WeeklyAIReview.userId, internalUserId))
      await tx.delete(schema.AIChat).where(eq(schema.AIChat.userId, internalUserId))
      await tx.delete(schema.AISavedInsight).where(eq(schema.AISavedInsight.userId, internalUserId))
      
      // Misc
      await tx.delete(schema.Notification).where(eq(schema.Notification.userId, internalUserId))
      await tx.delete(schema.ImportJob).where(eq(schema.ImportJob.userId, internalUserId))
      await tx.delete(schema.Feedback).where(eq(schema.Feedback.userId, internalUserId))
      await tx.delete(schema.UserGeoLog).where(eq(schema.UserGeoLog.userId, internalUserId))
      await tx.delete(schema.SharedReport).where(eq(schema.SharedReport.userId, internalUserId))
      await tx.delete(schema.Synchronization).where(eq(schema.Synchronization.userId, internalUserId))
      await tx.delete(schema.Subscription).where(eq(schema.Subscription.userId, internalUserId))
      await tx.delete(schema.PromoRedemption).where(eq(schema.PromoRedemption.userId, internalUserId))
      
      // Finally delete settings and user
      await tx.delete(schema.UserSettings).where(eq(schema.UserSettings.userId, internalUserId))
      await tx.delete(schema.User).where(eq(schema.User.id, internalUserId))
    })

    // 2. Delete user from Supabase auth
    const supabaseAdmin = getSupabaseAdminClient()
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
    
    if (deleteAuthError) {
      logger.error(`Failed to delete user from Supabase Auth: ${deleteAuthError.message}`)
      return NextResponse.json({ error: 'Failed to fully delete account from auth provider' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Account deleted successfully' })
  } catch (error) {
    logger.error('Account deletion error: ' + (error instanceof Error ? error.message : String(error)))
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
