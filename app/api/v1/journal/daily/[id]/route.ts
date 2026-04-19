/**
 * Journal Daily Note [id] API (v1)
 * PUT    /api/v1/journal/daily/[id] - Update journal entry
 * DELETE /api/v1/journal/daily/[id] - Delete journal entry
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const { id } = await params
    const body = await request.json()
    const { note, emotion } = body

    const existing = await prisma.dailyNote.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Journal not found' }, { status: 404 })
    if (existing.userId !== internalUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const journal = await prisma.dailyNote.update({
      where: { id },
      data: {
        note: note !== undefined ? note : existing.note,
        emotion: emotion !== undefined ? emotion : existing.emotion,
      },
    })

    return NextResponse.json({ journal })
  } catch (error: any) {
    logger.error('PUT /api/v1/journal/daily/[id]', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update journal entry' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const { id } = await params

    const existing = await prisma.dailyNote.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Journal not found' }, { status: 404 })
    if (existing.userId !== internalUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    await prisma.dailyNote.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('DELETE /api/v1/journal/daily/[id]', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete journal entry' }, { status: 500 })
  }
}
