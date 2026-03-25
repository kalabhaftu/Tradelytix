import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { invalidateUserCaches } from '@/server/accounts'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: accountId } = await params
    const internalUserId = identity.internalUserId
    const { newDate, isPropFirm, notificationId } = await request.json()

    if (!newDate) {
      return NextResponse.json(
        { success: false, error: 'New date is required' },
        { status: 400 }
      )
    }

    const adjustedDate = new Date(newDate)
    if (isNaN(adjustedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (isPropFirm) {
      await prisma.masterAccount.update({
        where: { id: accountId, userId: internalUserId },
        data: { createdAt: adjustedDate }
      })
    } else {
      await prisma.account.update({
        where: { id: accountId, userId: internalUserId },
        data: { createdAt: adjustedDate }
      })
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId, userId: internalUserId },
        data: { isRead: true }
      })
    }

    await invalidateUserCaches(internalUserId)

    return NextResponse.json({
      success: true,
      message: 'Account creation date adjusted successfully'
    })
  } catch (error) {
    console.error('Adjust account date error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to adjust account date' },
      { status: 500 }
    )
  }
}
