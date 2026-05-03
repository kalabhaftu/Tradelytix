import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { nanoid } from 'nanoid'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

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
  } catch (err) {
    console.error('[Goals GET]', err)
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

    if (!title || !metric || targetValue === undefined || !period || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const goal = await prisma.userGoal.create({
      data: {
        id: nanoid(),
        userId: internalUserId,
        title,
        description: description || null,
        metric,
        targetValue: Number(targetValue),
        currentValue: 0,
        period,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json({ goal })
  } catch (err) {
    console.error('[Goals POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
