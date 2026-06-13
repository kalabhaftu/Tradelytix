import { Prisma } from '@prisma/client'
import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, errorReportLimiter } from '@/lib/rate-limiter'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { extractIP } from '@/server/geolocation'
import { shouldIgnoreError } from '@/lib/logger'

function sanitizeMetadata(value: unknown, depth = 0): unknown {
  if (depth > 3) return '[truncated: max depth]'
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') {
    if (typeof value === 'string' && value.length > 1000) {
      return value.slice(0, 1000) + '... [truncated]'
    }
    return value
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeMetadata(item, depth + 1))
  }

  const sensitiveKeys = /password|token|secret|key|authorization|auth|cookie|card|cvv|ssn|credential/i
  const sanitized: Record<string, unknown> = {}
  let count = 0
  
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (count >= 50) {
      sanitized['_moreKeys'] = 'truncated: too many keys'
      break
    }
    if (sensitiveKeys.test(k)) {
      sanitized[k] = '[REDACTED]'
    } else {
      sanitized[k] = sanitizeMetadata(v, depth + 1)
    }
    count++
  }

  return sanitized
}

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, errorReportLimiter)
  if (rl) return rl

  try {
    const body = await req.json()

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 })
    }

    if (shouldIgnoreError(body.message, body.metadata)) {
      return NextResponse.json({ success: true })
    }

    const ip = extractIP(req.headers)
    const identity = await getResolvedUserIdentitySafe()
    const source = (body.source === 'SERVER' || body.source === 'API') ? body.source : 'CLIENT'

    await prisma.errorLog.create({
      data: {
        source,
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
