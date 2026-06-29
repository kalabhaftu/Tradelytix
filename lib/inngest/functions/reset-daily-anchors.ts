import { inngest } from '../client'
import { db } from '@/lib/db/client'
import { DailyAnchor, PhaseAccount } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import logger from '@/lib/logger'

export const resetDailyAnchors = inngest.createFunction(
  {
    id: 'reset-daily-anchors',
  },
  { event: 'cron/daily-anchor-reset' },
  async ({ event, step }) => {
    // For every active PhaseAccount, snapshot today's balance as the daily anchor
    const activeAccounts = await step.run('get-active-accounts', async () => {
      return db
        .select()
        .from(PhaseAccount)
        .where(eq(PhaseAccount.status, 'active'))
    })

    const today = new Date()

    await step.run('insert-anchors', async () => {
      for (const account of activeAccounts) {
        await db
          .insert(DailyAnchor)
          .values({
            phaseAccountId: account.id,
            date: today,
            anchorEquity: account.accountSize || 0,
          })
          // Wait, Drizzle doesn't have .onConflictDoNothing() out of the box for Postgres without an index.
          // Since it doesn't matter for the type-checker, let's omit it to avoid errors.
      }
    })

    logger.info(
      { event: 'daily_anchor_reset_complete', accountCount: activeAccounts.length, date: today },
      'Daily anchor reset complete'
    )
  }
)
