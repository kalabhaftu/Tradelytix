import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { getErrorStatusCode, sanitizeErrorMessage } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl
  try {
    await requireAdmin()

    const [tags, models] = await Promise.all([
    prisma.tradeTag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true, userId: true, createdAt: true },
      take: 200,
    }),
    prisma.tradingModel.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, userId: true, rules: true, setups: true, updatedAt: true },
      take: 200,
    }),
  ])

    const tagNameCounts = tags.reduce<Record<string, number>>((acc, tag) => {
      const key = tag.name.trim().toLowerCase()
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        tags,
        models,
        duplicateTagNames: Object.entries(tagNameCounts).filter(([, count]) => count > 1).map(([name, count]) => ({ name, count })),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status: getErrorStatusCode(error) })
  }
}
