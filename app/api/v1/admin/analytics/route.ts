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
    const type = url.searchParams.get('type') || 'geo'

    if (type === 'geo') {
      const geoData = await prisma.userGeoLog.groupBy({
        by: ['countryCode', 'country'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 50,
      })

      return NextResponse.json({
        success: true,
        data: geoData.map(g => ({
          countryCode: g.countryCode,
          country: g.country,
          count: g._count.id,
        })),
      })
    }

    if (type === 'trends') {
      // User registration trend (last 30 days by day)
      const d30 = new Date()
      d30.setDate(d30.getDate() - 30)

      const recentGeo = await prisma.userGeoLog.findMany({
        where: { createdAt: { gte: d30 } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true, countryCode: true },
      })

      // Group by date
      const byDate: Record<string, number> = {}
      recentGeo.forEach(g => {
        const day = g.createdAt.toISOString().split('T')[0]
        byDate[day] = (byDate[day] || 0) + 1
      })

      return NextResponse.json({
        success: true,
        data: Object.entries(byDate).map(([date, count]) => ({ date, count })),
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    const status = error.message?.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}
