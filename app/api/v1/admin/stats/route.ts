import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { sanitizeErrorMessage, getErrorStatusCode } from '@/lib/api-error'
import { NextRequest } from 'next/server'
import { getAuthBackedUserDirectory } from '@/server/admin-user-directory'

function isAfter(dateString: string | null | undefined, threshold: Date) {
  if (!dateString) return false

  const parsed = new Date(dateString)
  return !Number.isNaN(parsed.getTime()) && parsed >= threshold
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const now = new Date()
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [directory, totalFeedback, openFeedback, errors24h, errors7d, recentActivity] =
      await Promise.all([
        getAuthBackedUserDirectory(),
        prisma.feedback.count(),
        prisma.feedback.count({ where: { status: 'OPEN' } }),
        prisma.errorLog.count({ where: { createdAt: { gte: d24h } } }),
        prisma.errorLog.count({ where: { createdAt: { gte: d7 } } }),
        prisma.activityLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            action: true,
            entity: true,
            userId: true,
            metadata: true,
            createdAt: true,
            User: { select: { email: true } },
          },
        }),
      ])

    const newUsersLast7d = directory.authUsers.filter((user) => isAfter(user.created_at, d7)).length
    const newUsersLast30d = directory.authUsers.filter((user) => isAfter(user.created_at, d30)).length

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: directory.authUsers.length,
        newUsersLast7d,
        newUsersLast30d,
        orphanedDbUsers: directory.orphanedDbUsers.length,
        authUsersMissingDbRows: directory.authUsersMissingDbRows.length,
        totalFeedback,
        openFeedback,
        totalErrors24h: errors24h,
        totalErrors7d: errors7d,
        recentActivity,
      },
    })
  } catch (error: any) {
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}
