import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { prisma } from '@/lib/prisma'
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
    const { accountId } = body as { accountId?: string }

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'accountId is required' }, { status: 400 })
    }

    const now = new Date()
    await prisma.synchronization.upsert({
      where: {
        userId_service_accountId: {
          userId: identity.internalUserId,
          service: 'rithmic',
          accountId,
        },
      },
      update: {
        lastSyncedAt: now,
      },
      create: {
        userId: identity.internalUserId,
        service: 'rithmic',
        accountId,
        lastSyncedAt: now,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Sync marked as complete',
      lastSyncedAt: now.toISOString(),
    })
  } catch (error: any) {
    logger.error('POST /api/v1/rithmic/sync-complete', { error: error?.message }, 'api')
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark sync as complete',
      },
      { status: 500 }
    )
  }
}
