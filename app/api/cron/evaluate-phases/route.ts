import { NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { logger } from '@/lib/logger'
import { evaluateAllActivePhases } from '@/lib/services/phase-service'

/**
 * GET /api/cron/evaluate-phases
 * Manually trigger phase evaluations.
 * (Now part of the consolidated maintenance cron)
 */
export async function GET(request: NextRequest) {
  const authError = validateCronRequest(request)
  if (authError) return authError

  try {
    const result = await evaluateAllActivePhases()
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('[Cron] Phase evaluation failed: ' + (error instanceof Error ? error.message : String(error)))
    return NextResponse.json({
      success: false,
      error: 'Evaluation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * POST /api/cron/evaluate-phases
 */
export async function POST(request: NextRequest) {
  return GET(request)
}
