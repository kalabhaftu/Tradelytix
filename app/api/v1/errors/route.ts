import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, errorReportLimiter } from '@/lib/rate-limiter'
import { extractIP } from '@/server/geolocation'

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, errorReportLimiter)
  if (rl) return rl

  try {
    const body = await req.json()

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 })
    }

    const ip = extractIP(req.headers)

    await prisma.errorLog.create({
      data: {
        source: 'CLIENT',
        level: body.level || 'ERROR',
        message: String(body.message).slice(0, 2000),
        stack: body.stack ? String(body.stack).slice(0, 5000) : null,
        url: body.url ? String(body.url).slice(0, 500) : null,
        userId: body.userId || null,
        metadata: body.metadata || null,
        ipAddress: ip,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
