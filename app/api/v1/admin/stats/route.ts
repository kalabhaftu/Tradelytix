import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const now = new Date()
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [totalUsers, newUsers7d, newUsers30d, totalFeedback, openFeedback, errors24h, errors7d, recentActivity] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { Account: { some: {} } } }).catch(() => 0),
        prisma.user.count({ where: { Account: { some: {} } } }).catch(() => 0),
        prisma.feedback.count(),
        prisma.feedback.count({ where: { status: 'OPEN' } }),
        prisma.errorLog.count({ where: { createdAt: { gte: d24h } } }),
        prisma.errorLog.count({ where: { createdAt: { gte: d7 } } }),
        prisma.activityLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, action: true, entity: true, userId: true, createdAt: true },
        }),
      ])

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        newUsersLast7d: newUsers7d,
        newUsersLast30d: newUsers30d,
        totalFeedback,
        openFeedback,
        totalErrors24h: errors24h,
        totalErrors7d: errors7d,
        recentActivity,
      },
    })
  } catch (error: any) {
    const status = error.message === 'Unauthorized' || error.message?.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}
