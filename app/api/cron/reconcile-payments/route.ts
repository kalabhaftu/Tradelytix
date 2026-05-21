/**
 * GET /api/cron/reconcile-payments
 * Reconciles pending NOWPayments records on a shorter cadence than subscription renewal checks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { reconcilePendingPayments } from '@/lib/services/subscription'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const authError = validateCronRequest(request)
  if (authError) return authError

  try {
    logger.info('[Cron] Running payment reconciliation')
    const results = await reconcilePendingPayments()

    return NextResponse.json({
      success: true,
      message: 'Payment reconciliation completed',
      ...results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('[Cron] Payment reconciliation failed', error)
    return NextResponse.json(
      { success: false, error: 'Payment reconciliation failed', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
