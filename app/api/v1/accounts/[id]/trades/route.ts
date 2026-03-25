import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimitResponse = await applyRateLimit(request, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const internalUserId = identity.internalUserId
    const { id: accountId } = await params

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: internalUserId,
      },
      select: {
        id: true,
        number: true
      }
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    const trades = await prisma.trade.findMany({
      where: {
        accountId: account.id,
      },
      select: {
        id: true,
        pnl: true,
        commission: true,
        entryDate: true,
        closeDate: true,
        instrument: true,
        side: true,
        quantity: true,
        entryPrice: true,
        closePrice: true,
        createdAt: true,
      },
      orderBy: {
        entryDate: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: trades
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}
