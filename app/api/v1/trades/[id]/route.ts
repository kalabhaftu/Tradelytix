import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    const trade = await prisma.trade.findUnique({
      where: { id },
      include: {
        executions: true,
      },
    })

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    if (trade.userId !== identity.internalUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ success: true, trade })
  } catch (error: any) {
    logger.error('GET /api/v1/trades/[id] failed', { error: error?.message }, 'api')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.trade.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    if (existing.userId !== identity.internalUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const updated = await prisma.trade.update({
      where: { id },
      data: body
    })

    return NextResponse.json({ success: true, trade: updated })
  } catch (error: any) {
    logger.error('PATCH /api/v1/trades/[id] failed', { error: error?.message }, 'api')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params

    const existing = await prisma.trade.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    if (existing.userId !== identity.internalUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    await prisma.trade.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Trade deleted successfully' })
  } catch (error: any) {
    logger.error('DELETE /api/v1/trades/[id] failed', { error: error?.message }, 'api')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
