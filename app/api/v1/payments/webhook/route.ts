/**
 * POST /api/v1/payments/webhook
 * NOWPayments IPN callback handler.
 * Verifies HMAC-SHA512 signature and processes payment status updates.
 * Must be idempotent — NOWPayments may send the same event multiple times.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyIpnSignature, type IpnPayload } from '@/lib/services/nowpayments'
import { handleIpnWebhook } from '@/lib/services/subscription'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-nowpayments-sig') || ''
    const rawBody = await request.text()

    let payload: IpnPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error('[Webhook] Invalid JSON body')
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Verify IPN signature
    if (!verifyIpnSignature(payload as unknown as Record<string, unknown>, signature)) {
      console.error('[Webhook] Invalid IPN signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('[Webhook] Verified IPN:', {
      payment_id: payload.payment_id,
      status: payload.payment_status,
      order_id: payload.order_id,
    })

    // Process the webhook (idempotent)
    const result = await handleIpnWebhook(payload)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[Webhook] IPN processing error:', error)
    // Return 200 to prevent NOWPayments from retrying on our internal errors
    // We log the error for debugging
    return NextResponse.json({ success: false, error: 'Internal processing error' }, { status: 200 })
  }
}
