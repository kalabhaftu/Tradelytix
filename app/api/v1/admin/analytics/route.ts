import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { sanitizeErrorMessage, getErrorStatusCode } from '@/lib/api-error'
import { getCountryLabel, normalizeCountryCode, normalizeGeoRecord } from '@/lib/geo'
import { getAuthBackedUserDirectory } from '@/server/admin-user-directory'

function toIsoDay(value: string | null | undefined) {
  if (!value) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'geo'

    if (type === 'geo') {
      const directory = await getAuthBackedUserDirectory()
      const activeUserIds = directory.activeDbUsers.map((user) => user.id)

      const geoLogs = activeUserIds.length
        ? await prisma.userGeoLog.findMany({
            where: { userId: { in: activeUserIds } },
            orderBy: { createdAt: 'desc' },
            select: {
              userId: true,
              country: true,
              countryCode: true,
              city: true,
            },
          })
        : []

      const latestByUserId = new Map<string, (typeof geoLogs)[number]>()
      for (const log of geoLogs) {
        if (!latestByUserId.has(log.userId)) {
          latestByUserId.set(log.userId, log)
        }
      }

      const grouped = new Map<string, { countryCode: string | null; country: string; count: number }>()

      for (const log of latestByUserId.values()) {
        const normalized = normalizeGeoRecord(log)
        const countryCode = normalizeCountryCode(normalized?.countryCode) ?? null
        const country = getCountryLabel(normalized?.country, countryCode)

        if (!country || country === 'Unknown') continue

        const key = `${countryCode ?? '??'}:${country}`
        const current = grouped.get(key)

        grouped.set(key, {
          countryCode,
          country,
          count: (current?.count ?? 0) + 1,
        })
      }

      return NextResponse.json({
        success: true,
        data: Array.from(grouped.values()).sort((left, right) => right.count - left.count).slice(0, 50),
      })
    }

    if (type === 'trends') {
      const directory = await getAuthBackedUserDirectory()
      const d30 = new Date()
      d30.setDate(d30.getDate() - 30)

      const byDate: Record<string, number> = {}
      for (const user of directory.authUsers) {
        const day = toIsoDay(user.created_at)
        if (!day) continue

        if (new Date(day) < d30) continue
        byDate[day] = (byDate[day] || 0) + 1
      }

      return NextResponse.json({
        success: true,
        data: Object.entries(byDate)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([date, count]) => ({ date, count })),
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}
