import { NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { runSubscriptionChecks, reconcilePendingPayments } from '@/lib/services/subscription'
import { evaluateAllActivePhases } from '@/lib/services/phase-service'
import { createAllDailyAnchors } from '@/lib/services/anchor-service'
import { runDailyMaintenance } from '@/lib/services/maintenance'

/**
 * GET /api/cron/maintenance
 * Consolidated daily maintenance task for Vercel Hobby accounts.
 * Orchestrates all background processing in a single daily run.
 */
export async function GET(request: NextRequest) {
  const authError = validateCronRequest(request)
  if (authError) return authError

  const timestamp = new Date().toISOString()
  const results: any = {
    timestamp,
    tasks: {}
  }

  try {
    console.log('[Maintenance Cron] Starting daily maintenance...')

    // 1. Payment Reconciliation
    console.log('[Maintenance Cron] Task: Payment Reconciliation')
    results.tasks.payments = await reconcilePendingPayments()

    // 2. Subscription Checks (Due dates, expiries)
    console.log('[Maintenance Cron] Task: Subscription Checks')
    results.tasks.subscriptions = await runSubscriptionChecks()

    // 3. Phase Evaluation (Prop firm breaches/passes)
    console.log('[Maintenance Cron] Task: Phase Evaluation')
    results.tasks.phaseEvaluation = await evaluateAllActivePhases()

    // 4. Daily Anchors (Equity snapshots)
    console.log('[Maintenance Cron] Task: Daily Anchors')
    results.tasks.dailyAnchors = await createAllDailyAnchors()

    // 5. System Cleanup (Logs, Imports)
    console.log('[Maintenance Cron] Task: System Cleanup')
    results.tasks.systemCleanup = await runDailyMaintenance()

    console.log('[Maintenance Cron] Completed successfully.')

    return NextResponse.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error('[Maintenance Cron] Execution failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown maintenance error',
      timestamp
    }, { status: 500 })
  }
}

/**
 * POST /api/cron/maintenance
 * Manual trigger for testing
 */
export async function POST(request: NextRequest) {
  return GET(request)
}
