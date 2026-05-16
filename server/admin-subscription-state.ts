import { SubscriptionStatus, type FreeAccessInvite, type PaymentRecord, type PromoCode, type Subscription } from '@prisma/client'

export const ADMIN_PENDING_PROVIDER_STATUSES = [
  'pending',
  'waiting',
  'confirming',
  'confirmed',
  'sending',
  'partially_paid',
] as const

const TERMINAL_PROVIDER_STATUSES = ['finished', 'failed', 'expired', 'refunded'] as const
const PROVIDER_PENDING_EXPIRY_MS = 24 * 60 * 60 * 1000

type PaymentLike = Pick<
  PaymentRecord,
  'id' | 'providerStatus' | 'invoiceUrl' | 'createdAt' | 'updatedAt' | 'paidAt' | 'expiredAt' | 'amountUsd'
>

type SubscriptionLike = Pick<
  Subscription,
  'id' | 'status' | 'currentPeriodEnd' | 'currentPeriodStart' | 'nextPaymentDue' | 'cancelledAt'
> & {
  FreeAccess?: Pick<FreeAccessInvite, 'note' | 'type' | 'isActive' | 'expiresAt'> | null
  PromoCode?: Pick<PromoCode, 'code'> | null
}

export type AdminAccessSource = 'paid' | 'free_access' | 'promo' | 'manual' | 'admin' | 'none'

export function isPendingProviderStatus(status: string | null | undefined): boolean {
  return typeof status === 'string' && ADMIN_PENDING_PROVIDER_STATUSES.includes(status as (typeof ADMIN_PENDING_PROVIDER_STATUSES)[number])
}

export function derivePaymentState(payments: PaymentLike[]) {
  const sortedPayments = [...payments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  const latestPayment = sortedPayments[0] ?? null
  const openPayment = sortedPayments.find((payment) => isPendingProviderStatus(payment.providerStatus)) ?? null
  const paymentStatus = latestPayment?.providerStatus ?? null
  const isPending = isPendingProviderStatus(paymentStatus)
  const isTerminal = typeof paymentStatus === 'string' && TERMINAL_PROVIDER_STATUSES.includes(paymentStatus as (typeof TERMINAL_PROVIDER_STATUSES)[number])
  const isPaymentStale = Boolean(openPayment && Date.now() - openPayment.createdAt.getTime() >= PROVIDER_PENDING_EXPIRY_MS)
  const resolvedAt = latestPayment
    ? latestPayment.paidAt || latestPayment.expiredAt || (isTerminal ? latestPayment.updatedAt : null)
    : null

  return {
    latestPayment,
    openPayment,
    paymentStatus,
    hasOpenInvoice: Boolean(openPayment?.invoiceUrl),
    openInvoiceUrl: openPayment?.invoiceUrl ?? null,
    resolvedAt,
    isPending,
    isTerminal,
    isPaymentStale,
  }
}

export function deriveAccessSource(subscription: SubscriptionLike | null, role: string): AdminAccessSource {
  if (!subscription) return role === 'admin' ? 'admin' : 'none'
  if (subscription.status === 'free_access' || subscription.status === 'invited_free') return 'free_access'
  if (subscription.status === 'promo_active') return 'promo'
  if (subscription.status === 'active' && subscription.PromoCode?.code) return 'manual'
  return 'paid'
}

export function getDisplayAccessStatus(subscription: SubscriptionLike | null, role: string) {
  if (role === 'admin') return 'admin_override'
  return subscription?.status ?? 'no_subscription'
}

export function getAccessDescriptor(subscription: SubscriptionLike | null, role: string) {
  const accessSource = deriveAccessSource(subscription, role)
  const roleBypassAccess = role === 'admin'
  const isLifetime = Boolean(subscription?.FreeAccess?.type === 'lifetime')

  return {
    accessSource,
    roleBypassAccess,
    isLifetime,
    displayAccessStatus: getDisplayAccessStatus(subscription, role),
  }
}
