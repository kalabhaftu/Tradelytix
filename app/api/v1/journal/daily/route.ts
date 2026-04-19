/**
 * Journal Daily Notes API (v1)
 * GET  /api/v1/journal/daily - Fetch journal entry for a date
 * POST /api/v1/journal/daily - Create journal entry
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const accountId = searchParams.get('accountId')

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const journal = await prisma.dailyNote.findFirst({
      where: { userId: internalUserId, date: new Date(date), accountId: accountId || null },
    })

    return NextResponse.json({ journal })
  } catch (error: any) {
    logger.error('GET /api/v1/journal/daily', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch journal entry' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const body = await request.json()
    const { date, note, emotion, accountId } = body

    if (!date || note === undefined) {
      return NextResponse.json({ error: 'Date and note are required' }, { status: 400 })
    }

    let validAccountId: string | null = null
    if (accountId) {
      const userAccount = await prisma.account.findFirst({
        where: { id: accountId, userId: internalUserId },
        select: { id: true },
      })
      validAccountId = userAccount ? accountId : null
    }

    const existing = await prisma.dailyNote.findFirst({
      where: { userId: internalUserId, date: new Date(date), accountId: validAccountId },
    })

    if (existing) {
      return NextResponse.json({ error: 'Journal entry already exists for this date' }, { status: 409 })
    }

    const journal = await prisma.dailyNote.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        userId: internalUserId,
        date: new Date(date),
        note: note || '',
        emotion: emotion || null,
        accountId: validAccountId,
      },
    })

    return NextResponse.json({ journal }, { status: 201 })
  } catch (error: any) {
    logger.error('POST /api/v1/journal/daily', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
  }
}
