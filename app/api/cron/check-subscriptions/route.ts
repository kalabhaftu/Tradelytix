/**
 * GET /api/cron/check-subscriptions
 * Daily cron job: checks upcoming payment dues, sends notifications,
 * and expires overdue subscriptions past grace period.
 *
 * Runs daily at 8:00 UTC via Vercel Cron.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runSubscriptionChecks } from '@/lib/services/subscription'
import { validateCronRequest } from '@/lib/cron-auth'

export async function GET(request: NextRequest) {
  const authError = validateCronRequest(request)
  if (authError) return authError

  try {
    console.log('[Cron] Running subscription checks...')
    const results = await runSubscriptionChecks()

    console.log('[Cron] Subscription check results:', results)

    return NextResponse.json({
      success: true,
      message: 'Subscription checks completed',
      ...results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Subscription check failed:', error)
    return NextResponse.json(
      { success: false, error: 'Subscription check failed', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
