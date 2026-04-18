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
    const status = url.searchParams.get('status') || undefined
    const category = url.searchParams.get('category') || undefined

    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { Replies: { orderBy: { createdAt: 'asc' } } },
      }),
      prisma.feedback.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: { feedback: items, total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}
