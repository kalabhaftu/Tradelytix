import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { listDailyJournalEntries } from '@/server/daily-journal'

export async function GET(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const accountId = searchParams.get('accountId')

    const journals = await listDailyJournalEntries(internalUserId, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      accountId: accountId && accountId !== 'all' ? accountId : undefined,
    })

    return NextResponse.json({ journals })
  } catch (error: any) {
    logger.error('GET /api/v1/journal/list', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 })
  }
}