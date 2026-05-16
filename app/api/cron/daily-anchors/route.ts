import { NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAllDailyAnchors } from '@/lib/services/anchor-service'

/**
 * GET /api/cron/daily-anchors
 * Manually trigger daily anchor creation.
 * (Now part of the consolidated maintenance cron)
 */
export async function GET(request: NextRequest) {
  const authError = validateCronRequest(request)
  if (authError) return authError

  try {
    const result = await createAllDailyAnchors()
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Anchor creation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * POST /api/cron/daily-anchors
 */
export async function POST(request: NextRequest) {
  return GET(request)
}
