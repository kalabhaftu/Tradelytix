/**
 * NOWPayments API Client
 * Server-only service for creating invoices and verifying IPN callbacks.
 */

import crypto from 'crypto'

const API_BASE_URL = process.env.NOWPAYMENTS_API_BASE_URL || 'https://api.nowpayments.io/v1'
const API_KEY = process.env.NOWPAYMENTS_API_KEY || ''
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || ''

function getHeaders(): Record<string, string> {
  if (!API_KEY) throw new Error('NOWPAYMENTS_API_KEY is not configured')
  return { 'x-api-key': API_KEY, 'Content-Type': 'application/json' }
}

export interface CreateInvoiceParams {
  price_amount: number
  price_currency: string
  order_id: string
  order_description?: string
  pay_currency?: string
  ipn_callback_url?: string
  success_url?: string
  cancel_url?: string
}

export interface InvoiceResponse {
  id: string
  order_id: string
  price_amount: string
  price_currency: string
  invoice_url: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export type NowPaymentStatus =
  | 'waiting' | 'confirming' | 'confirmed' | 'sending'
  | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired'

export interface PaymentStatusResponse {
  payment_id: number
  invoice_id: number | null
  payment_status: NowPaymentStatus
  price_amount: number
  price_currency: string
  pay_amount: number
  actually_paid: number
  pay_currency: string
  order_id: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface IpnPayload {
  payment_id: number
  invoice_id: number
  payment_status: NowPaymentStatus
  price_amount: number
  price_currency: string
  pay_amount: number
  actually_paid: number
  pay_currency: string
  order_id: string
  order_description: string
  [key: string]: unknown
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject)
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortObject((value as Record<string, unknown>)[key])
        return result
      }, {})
  }

  return value
}

/** Create a hosted invoice page on NOWPayments */
export async function createInvoice(params: CreateInvoiceParams): Promise<InvoiceResponse> {
  const body = {
    ...params,
    ipn_callback_url: params.ipn_callback_url || process.env.NOWPAYMENTS_IPN_CALLBACK_URL,
    success_url: params.success_url || process.env.NOWPAYMENTS_SUCCESS_URL,
    cancel_url: params.cancel_url || process.env.NOWPAYMENTS_CANCEL_URL,
  }

  console.log('[NOWPayments] Creating invoice:', { order_id: body.order_id, price_amount: body.price_amount })

  const res = await fetch(`${API_BASE_URL}/invoice`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'unknown error')
    console.error('[NOWPayments] Invoice creation failed:', res.status, errorBody)
    throw new Error(`Failed to create invoice: ${res.status} — ${errorBody}`)
  }

  const data: InvoiceResponse = await res.json()
  console.log('[NOWPayments] Invoice created:', { id: data.id, invoice_url: data.invoice_url })
  return data
}

/** Get the minimum payment amount for a fiat/crypto pair */
export async function getMinAmount(currencyFrom: string, currencyTo: string): Promise<number> {
  const query = new URLSearchParams({
    currency_from: currencyFrom,
    currency_to: currencyTo,
  })

  const res = await fetch(`${API_BASE_URL}/min-amount?${query.toString()}`, {
    method: 'GET',
    headers: getHeaders(),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'unknown error')
    throw new Error(`Failed to get minimum payment amount: ${res.status} — ${errorBody}`)
  }

  const data = await res.json() as { min_amount?: number | string }
  return Number(data.min_amount || 0)
}

/** Get payment status by NOWPayments payment ID */
export async function getPaymentStatus(paymentId: string | number): Promise<PaymentStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/payment/${paymentId}`, {
    method: 'GET',
    headers: getHeaders(),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'unknown error')
    throw new Error(`Failed to get payment status: ${res.status} — ${errorBody}`)
  }

  return res.json()
}

/** Verify HMAC-SHA512 IPN signature from NOWPayments */
export function verifyIpnSignature(payload: Record<string, unknown>, signature: string): boolean {
  if (!IPN_SECRET || !signature) {
    console.error('[NOWPayments] Missing IPN_SECRET or signature')
    return false
  }

  try {
    const hmac = crypto.createHmac('sha512', IPN_SECRET)
    hmac.update(JSON.stringify(sortObject(payload)))
    const calculated = hmac.digest('hex')

    return crypto.timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(signature, 'hex'))
  } catch (error) {
    console.error('[NOWPayments] IPN signature verification error:', error)
    return false
  }
}

export function isTerminalStatus(status: NowPaymentStatus): boolean {
  return ['finished', 'failed', 'refunded', 'expired'].includes(status)
}

export function isSuccessStatus(status: NowPaymentStatus): boolean {
  return status === 'finished'
}

export function isFailureStatus(status: NowPaymentStatus): boolean {
  return ['failed', 'expired', 'refunded'].includes(status)
}
