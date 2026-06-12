/**
 * Admin Payments API
 * GET - List payment and invoice records with user info and derived lifecycle fields.
 * PATCH - Manually sync one payment or all pending payments for a user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'
import { reconcilePaymentRecord, reconcilePendingPayments } from '@/lib/services/subscription-service'
import { derivePaymentState } from '@/server/admin-subscription-state'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { createErrorResponse } from '@/lib/api-response'

function boundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

const paymentSyncSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('sync_payment'),
    paymentRecordId: z.string().trim().min(1).max(128),
  }).strict(),
  z.object({
    action: z.literal('sync_user'),
    email: z.string().trim().email().max(254),
  }).strict(),
])

export async function GET(request: NextRequest) {
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const page = boundedInt(request.nextUrl.searchParams.get('page'), 1, 1, 10000)
    const limit = boundedInt(request.nextUrl.searchParams.get('limit'), 50, 1, 100)
    const status = request.nextUrl.searchParams.get('status')?.trim().slice(0, 64) || undefined
    const search = request.nextUrl.searchParams.get('search')?.trim().slice(0, 254) || undefined

    const where: any = {}
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
  const rl = await applyRateLimit(request, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const body = await request.json().catch(() => null)
    const parsed = paymentSyncSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    if (parsed.data.action === 'sync_payment') {
      const payment = await prisma.paymentRecord.findUnique({
        where: { id: parsed.data.paymentRecordId },
      })
      if (!payment) {
        return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
      }

      const updated = await reconcilePaymentRecord(parsed.data.paymentRecordId, payment.userId)
      return NextResponse.json({ success: true, data: updated })
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const result = await reconcilePendingPayments({ userId: user.id })
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unauthorized'
    const statusCode = msg.includes('Unauthorized') || msg.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status: statusCode })
  }
}
