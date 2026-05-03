import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { nanoid } from 'nanoid'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

export const dynamic = 'force-dynamic'

function generateSlug(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, apiLimiter)
  if (rl) return rl

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const body = await req.json()
    const { title, dateFrom, dateTo, accountId, snapshot, expiresInDays } = body

    if (!snapshot || typeof snapshot !== 'object') {
      return NextResponse.json({ error: 'snapshot payload is required' }, { status: 400 })
    }

    const slug = generateSlug()
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const shared = await prisma.sharedReport.create({
      data: {
        id: nanoid(),
        userId: internalUserId,
        slug,
        title: title || 'Trading Report',
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        accountId: accountId || null,
        snapshot,
        isPublic: true,
        expiresAt,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const url = `${appUrl}/reports/shared/${slug}`
    return NextResponse.json({ slug, url, id: shared.id })
  } catch (err) {
    console.error('[Reports Share POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, apiLimiter)
  if (rl) return rl

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const reports = await prisma.sharedReport.findMany({
      where: { userId: internalUserId },
      select: {
        id: true,
        slug: true,
        title: true,
        dateFrom: true,
        dateTo: true,
        viewCount: true,
        isPublic: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ reports })
  } catch (err) {
    console.error('[Reports Share GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
