/**
 * GET /api/v1/payments/status?paymentRecordId=xxx
 * Returns the current status of a payment record.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { prisma } from '@/lib/prisma'
import { refreshPaymentRecordStatus } from '@/lib/services/subscription'

export async function GET(request: NextRequest) {
  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const paymentRecordId = request.nextUrl.searchParams.get('paymentRecordId')
    if (!paymentRecordId) {
      return NextResponse.json({ success: false, error: 'Missing paymentRecordId' }, { status: 400 })
    }

    const shouldRefresh = request.nextUrl.searchParams.get('refresh') === 'true'
    if (shouldRefresh) {
      await refreshPaymentRecordStatus(paymentRecordId, identity.internalUserId)
    }

    const record = await prisma.paymentRecord.findFirst({
      where: { id: paymentRecordId, userId: identity.internalUserId },
      select: {
        id: true,
        providerStatus: true,
        amountUsd: true,
        payCurrency: true,
        payAmount: true,
        invoiceUrl: true,
        paidAt: true,
        expiredAt: true,
        subscriptionPeriodEnd: true,
        createdAt: true,
      },
    })

    if (!record) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: record })
  } catch (error) {
    console.error('[Payment] Status check error:', error)
    return NextResponse.json({ success: false, error: 'Failed to check status' }, { status: 500 })
  }
}
