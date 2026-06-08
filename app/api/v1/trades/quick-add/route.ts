import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { logActivity, getClientIp } from '@/lib/activity-logger'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { buildSyntheticExecutionsFromTrade, buildTradePersistenceData } from '@/lib/trade-core'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const QuickAddSchema = z.object({
  instrument: z.string().min(1, 'Instrument is required'),
  side: z.enum(['buy', 'sell', 'BUY', 'SELL']),
  pnl: z.union([z.number(), z.string().transform((val) => {
    const parsed = parseFloat(val)
    if (isNaN(parsed)) throw new Error('Invalid number')
    return parsed
  })]),
  entryDate: z.string().optional(),
  accountNumber: z.string().optional()
})

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
    
    const parseResult = QuickAddSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { instrument, side, pnl, entryDate, accountNumber } = parseResult.data

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

    const tradePayload = buildTradePersistenceData({
      id: randomUUID(),
      instrument: instrument.toUpperCase(),
      side: side.toLowerCase(),
      pnl: parseFloat(String(pnl)),
      entryDate: dateString,
      closeDate: dateString,
      entryTime: new Date(dateString),
      exitTime: new Date(dateString),
      accountNumber: targetAccount,
      quantity: 1,
      entryPrice: '0',
      closePrice: '0',
      commission: 0,
      userId: internalUserId
    } as any)

    const trade = await prisma.$transaction(async (tx) => {
      const createdTrade = await tx.trade.create({
        data: tradePayload as any
      })

      await tx.tradeExecution.createMany({
        data: buildSyntheticExecutionsFromTrade(tradePayload as any) as any,
        skipDuplicates: true,
      })

      return createdTrade
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
    logger.error('Quick add trade error:', error, 'api')
    return NextResponse.json(
      { error: 'Failed to add trade' },
      { status: 500 }
    )
  }
}
