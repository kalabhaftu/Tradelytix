import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'

export async function GET(request: NextRequest) {
  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ notes: [] }, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      })
    }

    const notes = await prisma.dailyNote.findMany({
      where: { userId: identity.internalUserId },
      orderBy: { date: 'desc' },
      take: 365
    })

    return NextResponse.json({ notes }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
      }
    })
  } catch {
    return NextResponse.json({ notes: [] }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, note } = body

    if (!date || note === undefined) {
      return NextResponse.json({ error: 'Date and note are required' }, { status: 400 })
    }

    const noteDate = new Date(date)
    noteDate.setHours(0, 0, 0, 0)

    const savedNote = await prisma.dailyNote.upsert({
      where: {
        userId_accountId_date: {
          userId: identity.internalUserId,
          accountId: '',
          date: noteDate
        }
      },
      update: {
        note: note
      },
      create: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        userId: identity.internalUserId,
        accountId: null,
        date: noteDate,
        note: note
      }
    })

    return NextResponse.json({ note: savedNote })
  } catch (error) {
    if (error instanceof Error && error.message.includes('not authenticated')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const noteDate = new Date(date)
    noteDate.setHours(0, 0, 0, 0)

    await prisma.dailyNote.delete({
      where: {
        userId_accountId_date: {
          userId: identity.internalUserId,
          accountId: '',
          date: noteDate
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('not authenticated')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
