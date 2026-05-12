/**
 * GET /api/v1/subscription/status
 * Returns the current subscription status for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { getUserAccessStatus } from '@/lib/services/subscription'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: identity.internalUserId },
      select: { role: true },
    })

    const access = await getUserAccessStatus(identity.internalUserId, user?.role)

    return NextResponse.json({
      success: true,
      data: {
        hasAccess: access.hasAccess,
        status: access.status,
        reason: access.reason,
        currentPeriodEnd: access.subscription?.currentPeriodEnd,
        nextPaymentDue: access.subscription?.nextPaymentDue,
      },
    })
  } catch (error) {
    console.error('[Subscription] Status check error:', error)
    return NextResponse.json({ success: false, error: 'Failed to check status' }, { status: 500 })
  }
}
