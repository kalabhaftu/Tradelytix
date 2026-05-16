/**
 * Admin Subscriptions API
 * GET  - List all subscriptions with user info
 * PATCH - Admin actions (extend, cancel, change status)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'
import { reconcilePendingPayments } from '@/lib/services/subscription'
import { deriveAccessSource, derivePaymentState, getAccessDescriptor } from '@/server/admin-subscription-state'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
    const status = request.nextUrl.searchParams.get('status')
    const search = request.nextUrl.searchParams.get('search')

    let where: any = {}
    if (status) where.Subscription = { status: status as any }
    if (search) where.email = { contains: search, mode: 'insensitive' }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          Subscription: {
            include: {
              PaymentRecord: {
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                  id: true,
                  providerStatus: true,
                  amountUsd: true,
                  paidAt: true,
                  expiredAt: true,
                  createdAt: true,
                  updatedAt: true,
                  invoiceUrl: true,
                },
              },
              PromoCode: true,
              FreeAccess: true,
            },
          },
        },
        orderBy: { email: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const data = users.map((user) => {
      const subscription = user.Subscription
      const paymentState = derivePaymentState(subscription?.PaymentRecord ?? [])
      const access = getAccessDescriptor(subscription, user.role)

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        Subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          nextPaymentDue: subscription.nextPaymentDue,
          paymentStatus: paymentState.paymentStatus,
          latestPaymentPaidAt: paymentState.latestPayment?.paidAt || null,
          latestPaymentCreatedAt: paymentState.latestPayment?.createdAt || null,
          latestPaymentAmountUsd: paymentState.latestPayment?.amountUsd || null,
          hasOpenInvoice: paymentState.hasOpenInvoice,
          openInvoiceUrl: paymentState.openInvoiceUrl,
          resolvedAt: paymentState.resolvedAt,
          isPaymentStale: paymentState.isPaymentStale,
          roleBypassAccess: access.roleBypassAccess,
          accessSource: access.accessSource,
          displayAccessStatus: access.displayAccessStatus,
          PromoCode: subscription.PromoCode,
          FreeAccess: subscription.FreeAccess,
        } : null,
      }
    })

    return NextResponse.json({ success: true, data, total, page, limit })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unauthorized'
    const status = msg.includes('Unauthorized') || msg.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { subscriptionId, action, ...params } = body

    if (!subscriptionId || !action) {
      return NextResponse.json({ success: false, error: 'Missing subscriptionId or action' }, { status: 400 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        User: {
          select: { role: true },
        },
        FreeAccess: true,
        PromoCode: true,
      },
    })
    if (!subscription) {
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 })
    }

    const accessSource = deriveAccessSource(subscription, subscription.User.role)
    const isLifetimeFreeAccess = Boolean(subscription.FreeAccess?.type === 'lifetime')

    const respondBlocked = (message: string, status = 400) =>
      NextResponse.json(
        {
          success: false,
          error: message,
          message,
          meta: {
            accessSource,
            roleBypassAccess: subscription.User.role === 'admin',
          },
        },
        { status }
      )

    switch (action) {
      case 'sync': {
        const result = await reconcilePendingPayments({ userId: subscription.userId })
        return NextResponse.json({
          success: true,
          data: result,
          message: subscription.User.role === 'admin'
            ? 'Payment status synced. Admin role still bypasses access gating.'
            : 'Payment status synced.',
        })
      }
      case 'activate': {
        if (accessSource === 'free_access' || accessSource === 'promo') {
          return respondBlocked('This access type cannot be activated with the standard paid-access control.')
        }
        const periodEnd = params.periodEnd ? new Date(params.periodEnd) : new Date(Date.now() + 30 * 86400000)
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
            nextPaymentDue: periodEnd,
          },
        })
        return NextResponse.json({
          success: true,
          message: subscription.User.role === 'admin'
            ? 'Manual paid access activated. Admin role still bypasses access gating.'
            : 'Manual paid access activated.',
        })
      }
      case 'cancel':
        if (accessSource === 'free_access' || accessSource === 'promo') {
          return respondBlocked('This access type cannot be cancelled with the standard paid-access control.')
        }
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'cancelled', cancelledAt: new Date() },
        })
        return NextResponse.json({
          success: true,
          message: subscription.User.role === 'admin'
            ? 'Subscription marked cancelled. Admin role still bypasses access gating.'
            : 'Subscription marked cancelled.',
        })
      case 'expire':
        if (accessSource === 'free_access' || accessSource === 'promo') {
          return respondBlocked('This access type cannot be expired with the standard paid-access control.')
        }
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'expired' },
        })
        return NextResponse.json({
          success: true,
          message: subscription.User.role === 'admin'
            ? 'Subscription expired. Admin role still bypasses access gating.'
            : 'Subscription expired.',
        })
      case 'extend': {
        if (accessSource === 'free_access' || accessSource === 'promo') {
          return respondBlocked('This access type cannot be extended with the standard paid-access control.')
        }
        if (isLifetimeFreeAccess || (subscription.status === 'active' && !subscription.currentPeriodEnd)) {
          return respondBlocked('Cannot extend a lifetime or indefinite subscription')
        }
        const days = parseInt(params.days || '30')
        const currentEnd = subscription.currentPeriodEnd || new Date()
        const newEnd = new Date(currentEnd.getTime() + days * 86400000)
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { currentPeriodEnd: newEnd, nextPaymentDue: newEnd, status: 'active' },
        })
        return NextResponse.json({
          success: true,
          message: `Extended subscription by ${days} day${days === 1 ? '' : 's'}.`,
        })
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed'
    const status = msg.includes('Unauthorized') || msg.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}
