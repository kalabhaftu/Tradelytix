import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, importLimiter } from '@/lib/rate-limiter'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { createTradeImportJob } from '@/server/trade-import-jobs'

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, importLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const accountId = typeof body?.accountId === 'string' ? body.accountId : ''
    const trades = Array.isArray(body?.trades) ? body.trades : []

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'Account is required' }, { status: 400 })
    }

    if (trades.length === 0) {
      return NextResponse.json({ success: false, error: 'No trades provided' }, { status: 400 })
    }

    const job = await createTradeImportJob({
      internalUserId: identity.internalUserId,
      accountId,
      trades,
    })

    return NextResponse.json({ success: true, job }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create trade import job' }, { status: 500 })
  }
}
