/**
 * Initial App Load API (v1)
 * 
 * GET /api/v1/init
 * 
 * Lightweight initial load endpoint replacing /api/bundled-data.
 * Returns only what's needed at app startup: user profile, accounts, calendar notes.
 * Trades are fetched separately via /api/v1/trades with proper filtering.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getInitBootstrapData } from '@/server/init-bootstrap'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const payload = await getInitBootstrapData()
    const response = NextResponse.json(payload)
    
    // Cache: private (user-specific), revalidate every 60s
    response.headers.set('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=120')
    return response
    
  } catch (error: any) {
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[API] /api/v1/init error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
