import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { sanitizeErrorMessage, getErrorStatusCode } from '@/lib/api-error'

function boundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const url = new URL(req.url)
    const isExport = url.searchParams.get('export') === 'true'
    const source = url.searchParams.get('source')?.trim().slice(0, 64) || undefined
    const level = url.searchParams.get('level')?.trim().slice(0, 32) || undefined

    const where: any = {}
    if (source) where.source = source
    if (level) where.level = level

    if (isExport) {
      const allLogs = await prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5000,
      })

      const response = NextResponse.json({ success: true, data: allLogs })
      response.headers.set('Content-Disposition', `attachment; filename=error-logs-${new Date().toISOString().split('T')[0]}.json`)
      return response
    }

    const page = boundedInt(url.searchParams.get('page'), 1, 1, 10000)
    const limit = boundedInt(url.searchParams.get('limit'), 50, 1, 100)

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
    const clearAll = url.searchParams.get('all') === 'true'

    let result
    if (clearAll) {
      if (url.searchParams.get('confirm') !== 'DELETE_ALL_ERROR_LOGS') {
        return NextResponse.json({ success: false, error: 'Confirmation is required to clear all error logs' }, { status: 400 })
      }
      result = await prisma.errorLog.deleteMany({})
    } else {
      const olderThanDays = boundedInt(url.searchParams.get('olderThan'), 30, 1, 365)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - olderThanDays)

      result = await prisma.errorLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      })
    }

    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error: any) {
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}
