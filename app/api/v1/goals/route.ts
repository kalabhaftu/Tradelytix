import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { nanoid } from 'nanoid'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, apiLimiter)
  if (rl) return rl

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const goals = await prisma.userGoal.findMany({
      where: { userId: internalUserId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ goals })
  } catch (err: any) {
    if (err.message?.includes('not authenticated') || err.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    logger.error('Failed to fetch goals', err, 'Goals GET')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, apiLimiter)
  if (rl) return rl

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const body = await req.json()
    const { title, description, metric, targetValue, period, startDate, endDate } = body

    if (!title || !metric || targetValue === undefined || targetValue === null || !period || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const numericTargetValue = Number(targetValue)
    if (!Number.isFinite(numericTargetValue)) {
      return NextResponse.json({ error: 'Target value must be a valid number' }, { status: 400 })
    }

    const goal = await prisma.userGoal.create({
      data: {
        id: nanoid(),
        userId: internalUserId,
        title,
        description: description || null,
        metric,
        targetValue: numericTargetValue,
        currentValue: 0,
        period,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json({ goal })
  } catch (err: any) {
    if (err.message?.includes('not authenticated') || err.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    logger.error('Failed to create goal', err, 'Goals POST')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
