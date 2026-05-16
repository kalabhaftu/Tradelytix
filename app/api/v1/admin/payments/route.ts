/**
 * Admin Payments API
 * GET - List payment and invoice records with user info and derived lifecycle fields.
 * PATCH - Manually sync one payment or all pending payments for a user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'
import { reconcilePaymentRecord, reconcilePendingPayments } from '@/lib/services/subscription'
import { derivePaymentState } from '@/server/admin-subscription-state'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10)
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10)
    const status = request.nextUrl.searchParams.get('status')
    const search = request.nextUrl.searchParams.get('search')

    let where: any = {}
    if (status) where.providerStatus = status
    if (search) {
      where.Subscription = {
        User: {
          email: { contains: search, mode: 'insensitive' }
        }
      }
    }

    const [payments, total] = await Promise.all([
      prisma.paymentRecord.findMany({
        where,
        include: {
          Subscription: {
            include: {
              User: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
          },
          PromoCode: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentRecord.count({ where }),
    ])

    const data = payments.map((payment) => {
      const paymentState = derivePaymentState([payment])

      return {
        id: payment.id,
        amountUsd: payment.amountUsd,
        providerStatus: payment.providerStatus,
        providerInvoiceId: payment.providerInvoiceId,
        providerPaymentId: payment.providerPaymentId,
        invoiceUrl: payment.invoiceUrl,
        paidAt: payment.paidAt,
        expiredAt: payment.expiredAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        resolvedAt: paymentState.resolvedAt,
        accessStatus: payment.Subscription.status,
        isPending: paymentState.isPending,
        isTerminal: paymentState.isTerminal,
        isStale: paymentState.isPaymentStale,
        userEmail: payment.Subscription.User.email,
        promoCode: payment.PromoCode?.code || null,
      }
    })

    return NextResponse.json({ success: true, data, total, page, limit })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unauthorized'
    const statusCode = msg.includes('Unauthorized') || msg.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status: statusCode })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const action = String(body.action || '')

    if (action === 'sync_payment') {
      const paymentRecordId = String(body.paymentRecordId || '')
      if (!paymentRecordId) {
        return NextResponse.json({ success: false, error: 'Missing paymentRecordId' }, { status: 400 })
      }

      const payment = await prisma.paymentRecord.findUnique({
        where: { id: paymentRecordId },
      })
      if (!payment) {
        return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
      }

      const updated = await reconcilePaymentRecord(paymentRecordId, payment.userId)
      return NextResponse.json({ success: true, data: updated })
    }

    if (action === 'sync_user') {
      const email = String(body.email || '').trim()
      if (!email) {
        return NextResponse.json({ success: false, error: 'Missing email' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
      }

      const result = await reconcilePendingPayments({ userId: user.id })
      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unauthorized'
    const statusCode = msg.includes('Unauthorized') || msg.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status: statusCode })
  }
}
