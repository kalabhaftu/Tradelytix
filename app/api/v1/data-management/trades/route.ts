import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const internalUserId = identity.internalUserId

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Fetch trades for this user without any specific account/status filters
    // This is for the Data Management "everything" view
    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where: { 
          userId: internalUserId,
          // Exclude trades from pending/pending_approval accounts
          OR: [
            { phaseAccountId: null },
            {
              PhaseAccount: {
                NOT: {
                  status: { in: ['pending', 'pending_approval'] }
                }
              }
            }
          ]
        },
        orderBy: { exitTime: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.trade.count({
        where: { 
          userId: internalUserId,
          OR: [
            { phaseAccountId: null },
            {
              PhaseAccount: {
                NOT: {
                  status: { in: ['pending', 'pending_approval'] }
                }
              }
            }
          ]
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: trades,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('[Data Management Trades API] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
