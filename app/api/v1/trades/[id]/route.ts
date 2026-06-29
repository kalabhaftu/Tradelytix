import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { eq } from 'drizzle-orm'
import { invalidateTradesCache } from '@/lib/cache/invalidate-trade'

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

    const trade = await db.query.Trade.findFirst({
      where: (table, { eq }) => eq(table.id, id),
      with: {
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

    const existing = await db.query.Trade.findFirst({ where: (table, { eq }) => eq(table.id, id) })
    if (!existing) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    if (existing.userId !== identity.internalUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const updated = (await db.update(schema.Trade).set(body).where(eq(schema.Trade.id, id)).returning())[0]

    await invalidateTradesCache(identity.internalUserId)

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

    const existing = await db.query.Trade.findFirst({ where: (table, { eq }) => eq(table.id, id) })
    if (!existing) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    if (existing.userId !== identity.internalUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    await db.delete(schema.Trade).where(eq(schema.Trade.id, id))
    
    await invalidateTradesCache(identity.internalUserId)

    return NextResponse.json({ success: true, message: 'Trade deleted successfully' })
  } catch (error: any) {
    logger.error('DELETE /api/v1/trades/[id] failed', { error: error?.message }, 'api')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}