import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(request, apiLimiter)
  if (rl) return rl

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: identity.internalUserId },
    })

    if (!subscription) {
      return NextResponse.json({ success: false, error: 'No subscription found' }, { status: 404 })
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json({ success: true, message: 'Subscription already cancelled' })
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    })

    revalidateTag(`notifications-${identity.internalUserId}`, 'max')
    revalidateTag(`accounts-${identity.internalUserId}`, 'max')
    revalidateTag(`user-data-${identity.internalUserId}`, 'max')

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    })
  } catch (error) {
    logger.error('Cancel payment failed', error, 'Payment Cancel')
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
