/**
 * Calendar Notes API (v1)
 * GET    /api/v1/calendar/notes - Fetch all notes (365 limit)
 * POST   /api/v1/calendar/notes - Create/upsert note
 * DELETE /api/v1/calendar/notes - Delete note by date
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()

    const notes = await prisma.dailyNote.findMany({
      where: { userId: internalUserId },
      orderBy: { date: 'desc' },
      take: 365,
    })

    return NextResponse.json({ notes }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    })
  } catch (error: any) {
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ notes: [] }, { status: 200 })
    }
    return NextResponse.json({ notes: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const body = await request.json()
    const { date, note } = body

    if (!date || note === undefined) {
      return NextResponse.json({ error: 'Date and note are required' }, { status: 400 })
    }

    const noteDate = new Date(date)
    noteDate.setHours(0, 0, 0, 0)

    const savedNote = await prisma.dailyNote.upsert({
      where: {
        userId_accountId_date: { userId: internalUserId, accountId: '', date: noteDate },
      },
      update: { note },
      create: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        userId: internalUserId,
        accountId: null,
        date: noteDate,
        note,
      },
    })

    return NextResponse.json({ note: savedNote })
  } catch (error: any) {
    logger.error('POST /api/v1/calendar/notes', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const noteDate = new Date(date)
    noteDate.setHours(0, 0, 0, 0)

    await prisma.dailyNote.delete({
      where: {
        userId_accountId_date: { userId: internalUserId, accountId: '', date: noteDate },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('DELETE /api/v1/calendar/notes', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
