import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { logActivity, getClientIp } from '@/lib/activity-logger'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

export async function POST(req: NextRequest) {
  const rateLimitResponse = await applyRateLimit(req, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const internalUserId = identity.internalUserId
    const body = await req.json()
    const { instrument, side, pnl, entryDate, accountNumber } = body

    if (!instrument || !side || pnl === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: instrument, side, pnl' },
        { status: 400 }
      )
    }

    let targetAccount = accountNumber
    if (!targetAccount) {
      const firstAccount = await prisma.account.findFirst({
        where: { userId: internalUserId },
        select: { number: true }
      })
      targetAccount = firstAccount?.number
    }

    if (!targetAccount) {
      return NextResponse.json(
        { error: 'No trading account found. Please add an account first.' },
        { status: 400 }
      )
    }

    const now = new Date()
    const dateString = entryDate ? new Date(entryDate).toISOString() : now.toISOString()

    const trade = await prisma.trade.create({
      data: {
        id: randomUUID(),
        instrument: instrument.toUpperCase(),
        side: side.toLowerCase(),
        pnl: parseFloat(String(pnl)),
        entryDate: dateString,
        closeDate: dateString,
        accountNumber: targetAccount,
        quantity: 1,
        entryPrice: '0',
        closePrice: '0',
        commission: 0,
        userId: internalUserId
      }
    })

    logActivity({
      userId: internalUserId,
      action: 'TRADE_CREATED',
      entity: 'Trade',
      entityId: trade.id,
      metadata: { instrument, accountNumber: targetAccount },
      ipAddress: getClientIp(req),
    })

    return NextResponse.json({ success: true, trade })
  } catch (error) {
    console.error('Quick add trade error:', error)
    return NextResponse.json(
      { error: 'Failed to add trade' },
      { status: 500 }
    )
  }
}
