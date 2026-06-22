import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, apiLimiter)
  if (rl) return rl

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tradeIds } = body as { tradeIds: string[] }

    if (!Array.isArray(tradeIds) || tradeIds.length === 0) {
      return NextResponse.json({ success: false, error: 'tradeIds must be a non-empty array' }, { status: 400 })
    }

    const result = await prisma.trade.updateMany({
      where: {
        id: { in: tradeIds },
        userId: identity.internalUserId,
      },
      data: { groupId: null },
    })

    return NextResponse.json({ success: true, updated: result.count })
  } catch (error: any) {
    logger.error('Failed to batch ungroup trades', error, 'Batch Ungroup')
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
