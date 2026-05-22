import { Prisma } from '@prisma/client'
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, errorReportLimiter } from '@/lib/rate-limiter'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { extractIP } from '@/server/geolocation'

function sanitizeMetadata(value: unknown, depth = 0): unknown {
  if (depth > 2) return '[truncated]'
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.slice(0, 10).map((item) => sanitizeMetadata(item, depth + 1))

  const allowed = new Set(['component', 'action', 'route', 'status', 'code', 'source', 'userAgent'])
  const entries = Object.entries(value as Record<string, unknown>).filter(([key]) => allowed.has(key)).slice(0, 20)

  return Object.fromEntries(entries.map(([key, item]) => [key, sanitizeMetadata(item, depth + 1)]))
}

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, errorReportLimiter)
  if (rl) return rl

  try {
    const body = await req.json()

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 })
    }

    const ip = extractIP(req.headers)
    const identity = await getResolvedUserIdentitySafe()

    await prisma.errorLog.create({
      data: {
        source: 'CLIENT',
        level: body.level || 'ERROR',
        message: String(body.message).slice(0, 2000),
        stack: body.stack ? String(body.stack).slice(0, 5000) : null,
        url: body.url ? String(body.url).slice(0, 500) : null,
        userId: identity?.internalUserId || null,
        metadata: sanitizeMetadata(body.metadata) as Prisma.InputJsonValue,
        ipAddress: ip,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
