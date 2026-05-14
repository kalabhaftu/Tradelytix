/**
 * Subscription Service
 * Core business logic for managing subscriptions, payments, promos, and free access.
 */

import { prisma } from '@/lib/prisma'
import { SubscriptionStatus } from '@prisma/client'
import crypto from 'crypto'
import {
  createInvoice,
  getMinAmount,
  getPaymentStatus,
  isSuccessStatus,
  isFailureStatus,
  type IpnPayload,
} from './nowpayments'

const PRICE_USD = parseFloat(process.env.SUBSCRIPTION_PRICE_USD || '10')
const GRACE_DAYS = parseInt(process.env.SUBSCRIPTION_GRACE_DAYS || '3', 10)

// ---------------------------------------------------------------------------
// Access Checks
// ---------------------------------------------------------------------------

export interface AccessResult {
  hasAccess: boolean
  status: SubscriptionStatus | 'no_subscription' | 'admin'
  subscription: Awaited<ReturnType<typeof prisma.subscription.findUnique>> | null
  reason?: string
}

/** Check if a user has active access to the platform */
export async function getUserAccessStatus(userId: string, userRole?: string): Promise<AccessResult> {
  // Admins always have access
  if (userRole === 'admin') {
    return { hasAccess: true, status: 'admin' as any, subscription: null }
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { FreeAccess: true },
  })

  if (!subscription) {
    // Check if there's a free access invite for this user
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
    if (user) {
      const freeAccess = await prisma.freeAccessInvite.findUnique({
        where: { email: user.email },
      })
      if (freeAccess?.isActive) {
        // Auto-create subscription record for free access
        const sub = await prisma.subscription.create({
          data: {
            userId,
            status: freeAccess.type === 'lifetime' ? 'free_access' : 'invited_free',
            freeAccessId: freeAccess.id,
            currentPeriodStart: new Date(),
            currentPeriodEnd: freeAccess.expiresAt || null,
          },
        })
        await prisma.freeAccessInvite.update({
          where: { id: freeAccess.id },
          data: { registeredAt: new Date(), registeredUserId: userId },
        })
        return { hasAccess: true, status: sub.status, subscription: sub }
      }
    }
    return { hasAccess: false, status: 'no_subscription' as any, subscription: null, reason: 'No subscription found' }
  }

  const activeStatuses: SubscriptionStatus[] = ['active', 'free_access', 'invited_free', 'promo_active']
  if (activeStatuses.includes(subscription.status)) {
    if (
      (subscription.status === 'invited_free' || subscription.status === 'free_access') &&
      subscription.FreeAccess &&
      !subscription.FreeAccess.isActive
    ) {
      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'expired' },
      })
      return { hasAccess: false, status: 'expired', subscription: updated, reason: 'Free access revoked' }
    }

    // Check if free access has expired
    if (
      (subscription.status === 'invited_free' || subscription.status === 'free_access') &&
      subscription.currentPeriodEnd &&
      new Date() > subscription.currentPeriodEnd
    ) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'expired' },
      })
      return { hasAccess: false, status: 'expired', subscription, reason: 'Free access expired' }
    }
    return { hasAccess: true, status: subscription.status, subscription }
  }

  // Handle active "waiting" payments that might be expired
  if (subscription.status === 'unpaid' || subscription.status === 'past_due') {
    await expireAbandonedPayments(userId)
  }

  // past_due: within grace period, still allow access
  if (subscription.status === 'past_due') {
    const graceCutoff = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd.getTime() + GRACE_DAYS * 86400000)
      : null
    if (graceCutoff && new Date() <= graceCutoff) {
      return { hasAccess: true, status: 'past_due', subscription, reason: 'Grace period' }
    }
    // Past grace period
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'expired' },
    })
    return { hasAccess: false, status: 'expired', subscription, reason: 'Grace period expired' }
  }

  return { hasAccess: false, status: subscription.status, subscription, reason: `Status: ${subscription.status}` }
}

// ---------------------------------------------------------------------------
// Subscription Lifecycle
// ---------------------------------------------------------------------------

/** Ensure a subscription record exists for the user */
export async function ensureSubscription(userId: string) {
  return prisma.subscription.upsert({
    where: { userId },
    create: { userId, status: 'unpaid' },
    update: {},
  })
}

/** Create a payment invoice for a subscription */
export async function createSubscriptionInvoice(
  userId: string,
  options?: { promoCode?: string; payCurrency?: string; context?: 'signup' | 'renewal' }
) {
  const subscription = await ensureSubscription(userId)
  if (['active', 'free_access', 'invited_free', 'promo_active'].includes(subscription.status)) {
    return { subscription, invoiceUrl: null, paymentRecordId: null, alreadyActive: true, freeAccess: false }
  }

  let finalAmount = PRICE_USD
  let promoCodeRecord = null
  let discountAmount = 0

  // Apply promo code if provided
  if (options?.promoCode) {
    const promo = await validateAndGetPromo(options.promoCode, userId, options.context || 'signup')
    if (promo) {
      promoCodeRecord = promo
      if (promo.type === 'percentage_discount') {
        discountAmount = finalAmount * (promo.value / 100)
      } else if (promo.type === 'fixed_discount') {
        discountAmount = Math.min(promo.value, finalAmount)
      } else if (promo.type === 'free_months') {
        discountAmount = finalAmount // First month free
      } else if (promo.type === 'lifetime_free') {
        // Grant lifetime free access
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'promo_active', promoCodeId: promo.id },
        })
        await recordPromoRedemption(promo.id, userId)
        return { subscription, invoiceUrl: null, paymentRecordId: null, freeAccess: true }
      }
      finalAmount = Math.max(0, finalAmount - discountAmount)
    }
  }

  // If amount is 0 after discount, activate directly
  if (finalAmount <= 0) {
    const now = new Date()
    const freeMonths = promoCodeRecord?.type === 'free_months' ? Math.max(1, Math.floor(promoCodeRecord.value)) : 1
    const periodEnd = new Date(now.getTime() + freeMonths * 30 * 86400000)
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        nextPaymentDue: periodEnd,
        promoCodeId: promoCodeRecord?.id,
      },
    })
    if (promoCodeRecord) await recordPromoRedemption(promoCodeRecord.id, userId)
    return { subscription, invoiceUrl: null, paymentRecordId: null, freeAccess: true }
  }

  // Create NOWPayments invoice
  const periodStart = new Date()
  const periodEnd = new Date(periodStart.getTime() + 30 * 86400000)
  const orderId = `sub_${subscription.id}_${Date.now()}`
  const payCurrency = options?.payCurrency?.trim().toLowerCase()

  if (payCurrency) {
    const minAmount = await getMinAmount('usd', payCurrency)
    if (minAmount && finalAmount < minAmount) {
      throw new Error(`Payment amount is below NOWPayments minimum for ${payCurrency.toUpperCase()}`)
    }
  }

  const invoice = await createInvoice({
    price_amount: finalAmount,
    price_currency: 'usd',
    pay_currency: payCurrency || undefined,
    order_id: orderId,
    order_description: `Deltalytix Pro — Monthly Subscription`,
  })

  // Create payment record
  const paymentRecord = await prisma.paymentRecord.create({
    data: {
      userId,
      subscriptionId: subscription.id,
      amountUsd: finalAmount,
      providerInvoiceId: invoice.id,
      invoiceUrl: invoice.invoice_url,
      providerStatus: 'waiting',
      payCurrency: payCurrency || null,
      subscriptionPeriodStart: periodStart,
      subscriptionPeriodEnd: periodEnd,
      dueDate: periodStart,
      promoCodeId: promoCodeRecord?.id,
      discountAmount,
    },
  })

  return {
    subscription,
    invoiceUrl: invoice.invoice_url,
    invoiceId: invoice.id,
    paymentRecordId: paymentRecord.id,
    freeAccess: false,
  }
}

// ---------------------------------------------------------------------------
// IPN Webhook Handler (Idempotent)
// ---------------------------------------------------------------------------

/** Process an IPN webhook payload from NOWPayments */
export async function handleIpnWebhook(payload: IpnPayload) {
  const { payment_id, payment_status, order_id, invoice_id } = payload

  console.log('[Subscription] IPN received:', { payment_id, payment_status, order_id })

  // Find the payment record by invoice ID or order_id
  const lookupClauses = [
    invoice_id ? { providerInvoiceId: String(invoice_id) } : null,
    payment_id ? { providerPaymentId: String(payment_id) } : null,
  ].filter(Boolean) as Array<Record<string, unknown>>

  if (lookupClauses.length === 0) {
    return { processed: false, reason: 'Missing payment identifiers' }
  }

  let paymentRecord = await prisma.paymentRecord.findFirst({
    where: {
      OR: lookupClauses,
    },
    include: { Subscription: true },
  })

  if (!paymentRecord) {
    console.error('[Subscription] No payment record found for IPN:', { payment_id, invoice_id, order_id })
    return { processed: false, reason: 'Payment record not found' }
  }

  // Idempotency: skip if already in terminal state
  if (paymentRecord.providerStatus === 'finished' && payment_status !== 'refunded') {
    console.log('[Subscription] Payment already finished, skipping:', paymentRecord.id)
    return { processed: true, reason: 'Already processed' }
  }

  // Update payment record
  const updateData: any = {
    providerStatus: payment_status,
    providerPaymentId: String(payment_id),
    payCurrency: payload.pay_currency,
    payAmount: payload.pay_amount,
    rawProviderPayload: payload as any,
  }

  if (isSuccessStatus(payment_status)) {
    updateData.paidAt = new Date()
  } else if (isFailureStatus(payment_status)) {
    updateData.expiredAt = new Date()
  }

  await prisma.paymentRecord.update({
    where: { id: paymentRecord.id },
    data: updateData,
  })

  // Update subscription status based on payment outcome
  if (isSuccessStatus(payment_status)) {
    await prisma.subscription.update({
      where: { id: paymentRecord.subscriptionId },
      data: {
        status: 'active',
        currentPeriodStart: paymentRecord.subscriptionPeriodStart,
        currentPeriodEnd: paymentRecord.subscriptionPeriodEnd,
        nextPaymentDue: paymentRecord.subscriptionPeriodEnd,
      },
    })

    // Create success notification
    await createPaymentNotification(
      paymentRecord.userId,
      'PAYMENT_RECEIVED',
      'Payment Confirmed',
      `Your subscription payment of $${paymentRecord.amountUsd} has been confirmed. Access is active until ${paymentRecord.subscriptionPeriodEnd?.toLocaleDateString()}.`
    )
    await createPaymentNotification(
      paymentRecord.userId,
      'ACCESS_RESTORED',
      'Access Restored',
      'Your Deltalytix Pro access is active again.'
    )
  } else if (isFailureStatus(payment_status)) {
    await createPaymentNotification(
      paymentRecord.userId,
      'PAYMENT_FAILED',
      'Payment Failed',
      `Your payment of $${paymentRecord.amountUsd} ${payment_status}. Please try again to maintain access.`
    )
  }

  return { processed: true, status: payment_status }
}

// ---------------------------------------------------------------------------
// Promo Codes
// ---------------------------------------------------------------------------

async function validateAndGetPromo(code: string, userId: string, context: 'signup' | 'renewal' = 'signup') {
  const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } })
  if (!promo || !promo.isActive) return null
  if (promo.validUntil && new Date() > promo.validUntil) return null
  if (promo.validFrom && new Date() < promo.validFrom) return null
  if (promo.maxUses && promo.usesCount >= promo.maxUses) return null
  if (promo.applicability === 'signup_only' && context !== 'signup') return null
  if (promo.applicability === 'renewal_only' && context !== 'renewal') return null

  // Check if user already redeemed
  const existing = await prisma.promoRedemption.findUnique({
    where: { promoCodeId_userId: { promoCodeId: promo.id, userId } },
  })
  if (existing) return null

  return promo
}

async function recordPromoRedemption(promoCodeId: string, userId: string) {
  await prisma.$transaction([
    prisma.promoRedemption.create({ data: { promoCodeId, userId } }),
    prisma.promoCode.update({
      where: { id: promoCodeId },
      data: { usesCount: { increment: 1 } },
    }),
  ])
}

/** Validate a promo code for a user (public API) */
export async function validatePromoCode(code: string, userId: string) {
  const promo = await validateAndGetPromo(code, userId)
  if (!promo) return null
  return {
    id: promo.id,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    applicability: promo.applicability,
    discountDescription: getDiscountDescription(promo),
  }
}

export async function refreshPaymentRecordStatus(paymentRecordId: string, userId: string) {
  const record = await prisma.paymentRecord.findFirst({
    where: { id: paymentRecordId, userId },
  })

  if (!record) return null
  if (!record.providerPaymentId) return record
  if (['finished', 'failed', 'expired', 'refunded'].includes(record.providerStatus || '')) return record

  const provider = await getPaymentStatus(record.providerPaymentId)
  await handleIpnWebhook(provider as unknown as IpnPayload)

  return prisma.paymentRecord.findFirst({
    where: { id: paymentRecordId, userId },
  })
}

function getDiscountDescription(promo: { type: string; value: number }) {
  switch (promo.type) {
    case 'percentage_discount': return `${promo.value}% off`
    case 'fixed_discount': return `$${promo.value} off`
    case 'free_months': return `${promo.value} month(s) free`
    case 'lifetime_free': return 'Lifetime free access'
    default: return ''
  }
}

// ---------------------------------------------------------------------------
// Free Access Management (Admin)
// ---------------------------------------------------------------------------

export async function grantFreeAccess(params: {
  email: string
  type: 'lifetime' | 'until_date' | 'one_time_signup'
  expiresAt?: Date
  note?: string
  grantedBy?: string
}) {
  const invite = await prisma.freeAccessInvite.upsert({
    where: { email: params.email },
    create: {
      email: params.email,
      type: params.type,
      expiresAt: params.expiresAt,
      note: params.note,
      grantedBy: params.grantedBy,
      isActive: true,
    },
    update: {
      type: params.type,
      expiresAt: params.expiresAt,
      note: params.note,
      grantedBy: params.grantedBy,
      isActive: true,
      revokedAt: null,
    },
  })

  // If user already exists, auto-activate their subscription
  const user = await prisma.user.findUnique({ where: { email: params.email } })
  if (user) {
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: 'free_access',
        freeAccessId: invite.id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: params.expiresAt || null,
      },
      update: {
        status: 'free_access',
        freeAccessId: invite.id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: params.expiresAt || null,
      },
    })

    await createPaymentNotification(
      user.id,
      'ADMIN_FREE_ACCESS_GRANTED',
      'Free Access Granted',
      params.note || 'You have been granted free access to Deltalytix Pro.'
    )
  }

  return invite
}

export async function revokeFreeAccess(email: string) {
  const invite = await prisma.freeAccessInvite.findUnique({ where: { email } })
  if (!invite) return null

  await prisma.freeAccessInvite.update({
    where: { id: invite.id },
    data: { isActive: false, revokedAt: new Date() },
  })

  if (invite.registeredUserId) {
    await prisma.subscription.updateMany({
      where: { userId: invite.registeredUserId, freeAccessId: invite.id },
      data: { status: 'expired' },
    })

    await createPaymentNotification(
      invite.registeredUserId,
      'ADMIN_FREE_ACCESS_REVOKED',
      'Free Access Revoked',
      'Your free access to Deltalytix Pro has been revoked.'
    )
  }

  return invite
}

// ---------------------------------------------------------------------------
// Cron: Subscription Checks
// ---------------------------------------------------------------------------

/**
 * Automatically expire payment records that have been in a non-terminal state for too long.
 * Default timeout is 24 hours.
 */
export async function expireAbandonedPayments(userId?: string) {
  const timeoutMs = 2 * 60 * 60 * 1000 // 2 hours
  const cutoff = new Date(Date.now() - timeoutMs)

  const pendingPayments = await prisma.paymentRecord.findMany({
    where: {
      userId,
      providerStatus: { in: ['pending', 'waiting', 'confirming', 'sending'] },
      createdAt: { lt: cutoff },
    },
  })

  if (pendingPayments.length === 0) return { expired: 0 }

  console.log(`[Subscription] Found ${pendingPayments.length} potentially abandoned payments.`)

  let expiredCount = 0
  for (const record of pendingPayments) {
    try {
      if (record.providerPaymentId) {
        // Double check status with provider
        const status = await getPaymentStatus(record.providerPaymentId)
        if (status.payment_status && status.payment_status !== record.providerStatus) {
          // If status changed, handle it normally
          await handleIpnWebhook(status as any)
          continue
        }
      }

      // If still non-terminal and old, expire it
      await prisma.paymentRecord.update({
        where: { id: record.id },
        data: {
          providerStatus: 'expired',
          expiredAt: new Date(),
        },
      })
      expiredCount++
    } catch (error) {
      console.error(`[Subscription] Failed to expire payment ${record.id}:`, error)
    }
  }

  return { expired: expiredCount }
}

export async function runSubscriptionChecks() {
  const now = new Date()
  const results = { notified: 0, expired: 0, abandonedCleaned: 0, errors: [] as string[] }

  // 1. Clean up abandoned payments first
  try {
    const cleanup = await expireAbandonedPayments()
    results.abandonedCleaned = cleanup.expired
  } catch (err) {
    results.errors.push(`Abandoned Cleanup: ${err instanceof Error ? err.message : 'unknown error'}`)
  }

  // Find active subscriptions with upcoming due dates
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ['active', 'past_due'] },
      nextPaymentDue: { not: null },
    },
    include: { User: { select: { id: true, email: true } } },
  })

  for (const sub of subscriptions) {
    try {
      if (!sub.nextPaymentDue) continue
      const daysUntilDue = Math.ceil((sub.nextPaymentDue.getTime() - now.getTime()) / 86400000)

      if (daysUntilDue === 3) {
        await createPaymentNotification(sub.userId, 'PAYMENT_DUE_SOON', 'Payment Due Soon',
          'Your subscription payment is due in 3 days.')
        results.notified++
      } else if (daysUntilDue === 1) {
        await createPaymentNotification(sub.userId, 'PAYMENT_DUE_SOON', 'Payment Due Tomorrow',
          'Your subscription payment is due tomorrow.')
        results.notified++
      } else if (daysUntilDue === 0) {
        await createPaymentNotification(sub.userId, 'PAYMENT_DUE_TODAY', 'Payment Due Today',
          'Your subscription payment is due today. Please renew to keep your access.')
        results.notified++
      } else if (daysUntilDue < 0 && daysUntilDue >= -GRACE_DAYS) {
        // Within grace period
        if (sub.status !== 'past_due') {
          await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'past_due' } })
        }
        await createPaymentNotification(sub.userId, 'PAYMENT_OVERDUE', 'Payment Overdue',
          `Your payment is overdue. You have ${GRACE_DAYS + daysUntilDue} day(s) left before access is suspended.`)
        results.notified++
      } else if (daysUntilDue < -GRACE_DAYS) {
        // Past grace period — expire
        await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'expired' } })
        await createPaymentNotification(sub.userId, 'SUBSCRIPTION_EXPIRED', 'Subscription Expired',
          'Your subscription has expired. Please renew to regain access.')
        results.expired++
      }
    } catch (err) {
      results.errors.push(`Sub ${sub.id}: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// Notification Helper
// ---------------------------------------------------------------------------

async function createPaymentNotification(
  userId: string,
  type: string,
  title: string,
  message: string
) {
  try {
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type: type as any,
        title,
        message,
        priority: type === 'SUBSCRIPTION_EXPIRED' ? 'CRITICAL' : 'HIGH',
        isRead: false,
      },
    })
  } catch (error) {
    console.error('[Subscription] Failed to create notification:', error)
  }
}
