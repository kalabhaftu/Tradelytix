import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { buildSettingsMirrorData } from '@/lib/user-settings'

// GET - Get backtest input mode preference
export async function GET(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    const userId = identity?.internalUserId

    if (!userId) {
      return NextResponse.json({ mode: 'manual' }, { status: 200 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        backtestInputMode: true,
        settings: {
          select: { backtestInputMode: true }
        }
      }
    })

    return NextResponse.json({ 
      mode: user?.settings?.backtestInputMode || user?.backtestInputMode || 'manual' 
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ mode: 'manual' }, { status: 200 })
  }
}

// POST - Update backtest input mode preference
export async function POST(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const identity = await getResolvedUserIdentitySafe()
    const userId = identity?.internalUserId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mode } = await request.json()

    if (!mode || !['manual', 'simple'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        timezone: true,
        theme: true,
        accountFilterSettings: true,
        aiSettings: true,
        backtestInputMode: true,
        breakEvenThreshold: true,
        pnlDisplayMode: true,
        accentPack: true,
        autoAdjustAccountDate: true,
      }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: buildSettingsMirrorData(currentUser as any, { backtestInputMode: mode })
      })

      await tx.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          backtestInputMode: mode,
        },
        update: {
          backtestInputMode: mode,
        }
      })
    })

    return NextResponse.json({ success: true, mode }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update preference' },
      { status: 500 }
    )
  }
}

