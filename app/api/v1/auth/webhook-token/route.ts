import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { randomUUID } from 'crypto'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, apiLimiter)
  if (rl) return rl

  try {
    const { internalUserId } = await getResolvedUserIdentity()

    const settings = await prisma.userSettings.findUnique({
      where: { userId: internalUserId },
      select: { webhookToken: true },
    })

    const token = settings?.webhookToken ?? null
    return NextResponse.json({
      hasToken: Boolean(token),
      token,
    })
  } catch (err) {
    logger.error('Failed to get webhook token', err, 'Webhook Token GET')
    return NextResponse.json({ error: 'Failed to fetch webhook token' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, apiLimiter)
  if (rl) return rl

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const token = randomUUID()

    await prisma.userSettings.upsert({
      where: { userId: internalUserId },
      create: { userId: internalUserId, webhookToken: token },
      update: { webhookToken: token },
    })

    return NextResponse.json({ token })
  } catch (err) {
    logger.error('Failed to regenerate webhook token', err, 'Webhook Token POST')
    return NextResponse.json({ error: 'Failed to regenerate webhook token' }, { status: 500 })
  }
}

