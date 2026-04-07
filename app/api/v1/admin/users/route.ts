import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')))
    const search = url.searchParams.get('search') || ''

    const where = search
      ? { OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
        ]}
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { email: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isFirstConnection: true,
          timezone: true,
          _count: { select: { Account: true, Notification: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    // Get latest geo for each user
    const userIds = users.map(u => u.id)
    const geoLogs = await prisma.userGeoLog.findMany({
      where: { userId: { in: userIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
      select: { userId: true, country: true, countryCode: true, city: true, createdAt: true },
    })

    const geoMap = new Map(geoLogs.map(g => [g.userId, g]))

    const enriched = users.map(u => ({
      ...u,
      geo: geoMap.get(u.id) || null,
    }))

    return NextResponse.json({
      success: true,
      data: { users: enriched, total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') || error.message === 'Unauthorized' ? 403 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}
