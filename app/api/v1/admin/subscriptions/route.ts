/**
 * Admin Subscriptions API
 * GET  - List all subscriptions with user info
 * PATCH - Admin actions (extend, cancel, change status)
 */

import { NextRequest, NextResponse } from 'next/server'
import { SubscriptionStatus } from '@prisma/client'
import { z } from 'zod'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'
import { reconcilePendingPayments } from '@/lib/services/subscription'
import { deriveAccessSource, derivePaymentState, getAccessDescriptor } from '@/server/admin-subscription-state'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { createErrorResponse } from '@/lib/api-response'
import { getErrorStatusCode, sanitizeErrorMessage } from '@/lib/api-error'

function boundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

const subscriptionActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('sync'), subscriptionId: z.string().trim().min(1) }).strict(),
  z.object({ action: z.literal('activate'), subscriptionId: z.string().trim().min(1), periodEnd: z.string().date().optional() }).strict(),
  z.object({ action: z.literal('cancel'), subscriptionId: z.string().trim().min(1) }).strict(),
  z.object({ action: z.literal('expire'), subscriptionId: z.string().trim().min(1) }).strict(),
  z.object({ action: z.literal('extend'), subscriptionId: z.string().trim().min(1), days: z.coerce.number().int().min(1).max(365) }).strict(),
])

export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const page = boundedInt(request.nextUrl.searchParams.get('page'), 1, 1, 10000)
    const limit = boundedInt(request.nextUrl.searchParams.get('limit'), 50, 1, 100)
    const rawStatus = request.nextUrl.searchParams.get('status')
    const status = rawStatus && Object.values(SubscriptionStatus).includes(rawStatus as SubscriptionStatus)
      ? rawStatus as SubscriptionStatus
      : undefined
    const search = request.nextUrl.searchParams.get('search')?.trim().slice(0, 254) || undefined

    const where: any = {}
    if (status) where.Subscription = { status }
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
    const msg = sanitizeErrorMessage(error)
    return NextResponse.json({ success: false, error: msg }, { status: getErrorStatusCode(error) })
  }
}

export async function PATCH(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const body = await request.json().catch(() => null)
    const parsed = subscriptionActionSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const { subscriptionId, action } = parsed.data
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
        const periodEnd = parsed.data.periodEnd ? new Date(`${parsed.data.periodEnd}T00:00:00.000Z`) : new Date(Date.now() + 30 * 86400000)
        if (periodEnd <= new Date()) {
          return createErrorResponse('periodEnd must be in the future', 400)
        }
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
        const currentEnd = subscription.currentPeriodEnd || new Date()
        const newEnd = new Date(currentEnd.getTime() + parsed.data.days * 86400000)
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { currentPeriodEnd: newEnd, nextPaymentDue: newEnd, status: 'active' },
        })
        return NextResponse.json({
          success: true,
          message: `Extended subscription by ${parsed.data.days} day${parsed.data.days === 1 ? '' : 's'}.`,
        })
      }
    }
  } catch (error) {
    const msg = sanitizeErrorMessage(error)
    return NextResponse.json({ success: false, error: msg }, { status: getErrorStatusCode(error) })
  }
}
