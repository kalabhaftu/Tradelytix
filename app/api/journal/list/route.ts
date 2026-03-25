import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'

// GET - Fetch all journal entries for a user in a date range
export async function GET(request: Request) {
  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = identity.internalUserId

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const accountId = searchParams.get('accountId')

    const where: any = {
      userId
    }

    if (accountId && accountId !== 'all') {
      where.accountId = accountId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const journals = await prisma.dailyNote.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      include: {
        Account: {
          select: {
            id: true,
            name: true,
            number: true
          }
        }
      }
    })

    return NextResponse.json({ journals })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch journal entries' },
      { status: 500 }
    )
  }
}

