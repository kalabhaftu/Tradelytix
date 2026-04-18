import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { sanitizeErrorMessage, getErrorStatusCode } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')))
    const source = url.searchParams.get('source') || undefined
    const level = url.searchParams.get('level') || undefined

    const where: any = {}
    if (source) where.source = source
    if (level) where.level = level

    const [items, total] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.errorLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: { errors: items, total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}

export async function DELETE(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const url = new URL(req.url)
    const olderThanDays = parseInt(url.searchParams.get('olderThan') || '30')
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - olderThanDays)

    const result = await prisma.errorLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })

    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error: any) {
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}
