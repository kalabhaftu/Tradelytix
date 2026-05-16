/**
 * TradingView Webhook Import
 *
 * Receives trade close alerts from TradingView and creates trades automatically.
 * Users get a unique webhook URL from Settings → Import → TradingView Webhook.
 *
 * TradingView alert message format (JSON string in alert body):
 * {
 *   "token": "<user_webhook_token>",
 *   "symbol": "EURUSD",
 *   "side": "BUY",
 *   "entry_price": 1.0850,
 *   "close_price": 1.0920,
 *   "quantity": 0.1,
 *   "pnl": 70.00,
 *   "entry_time": "2024-01-15T09:30:00Z",
 *   "close_time": "2024-01-15T14:45:00Z",
 *   "stop_loss": 1.0800,
 *   "take_profit": 1.0950,
 *   "comment": "EMA crossover strategy"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { applyRateLimit, webhookLimiter } from '@/lib/rate-limiter'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const MAX_WEBHOOK_BODY_BYTES = 64 * 1024
const MAX_PRICE = 1_000_000_000
const MAX_QUANTITY = 1_000_000_000
const MAX_PNL = 1_000_000_000

const numericField = z.coerce.number().finite().min(0).max(MAX_PRICE)
const optionalNumericField = z.coerce.number().finite().min(0).max(MAX_PRICE).optional().nullable()

const tradingViewPayloadSchema = z.object({
  token: z.string().trim().min(16).max(256),
  symbol: z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9._:-]+$/),
  side: z.string().trim().transform((value) => value.toUpperCase()).pipe(z.enum(['BUY', 'SELL', 'LONG', 'SHORT'])),
  entry_price: numericField,
  close_price: numericField,
  quantity: z.coerce.number().finite().gt(0).max(MAX_QUANTITY).optional().default(1),
  pnl: z.coerce.number().finite().min(-MAX_PNL).max(MAX_PNL).optional().default(0),
  entry_time: z.string().datetime({ offset: true }).optional(),
  close_time: z.string().datetime({ offset: true }).optional(),
  stop_loss: optionalNumericField,
  take_profit: optionalNumericField,
  comment: z.string().trim().max(500).optional(),
}).strict()

function parseWebhookDate(value: string | undefined) {
  const date = value ? new Date(value) : new Date()
  const now = Date.now()
  const earliest = Date.UTC(2000, 0, 1)
  const latest = now + 24 * 60 * 60 * 1000

  if (!Number.isFinite(date.getTime()) || date.getTime() < earliest || date.getTime() > latest) {
    throw new Error('Invalid trade timestamp')
  }

  return date
}

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, webhookLimiter)
  if (rl) return rl

  try {
    const rawBody = await req.text()
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_WEBHOOK_BODY_BYTES) {
      return createErrorResponse('Payload too large', 413, undefined, 'PAYLOAD_TOO_LARGE')
    }

    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return createErrorResponse('Invalid JSON body', 400, undefined, 'INVALID_JSON')
    }

    const parsed = tradingViewPayloadSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse('Validation failed', 400, parsed.error.flatten(), 'VALIDATION_ERROR')
    }

    const payload = parsed.data
    const entryDate = parseWebhookDate(payload.entry_time)
    const closeDate = parseWebhookDate(payload.close_time)

    if (closeDate.getTime() < entryDate.getTime()) {
      return createErrorResponse('close_time must be after entry_time', 400, undefined, 'INVALID_TRADE_TIME_RANGE')
    }

    const userSettings = await prisma.userSettings.findFirst({
      where: { webhookToken: payload.token },
      select: { userId: true },
    }).catch(() => null)

    if (!userSettings) {
      return createErrorResponse('Invalid or expired webhook token', 401, undefined, 'INVALID_WEBHOOK_TOKEN')
    }

    const defaultAccount = await prisma.account.findFirst({
      where: { userId: userSettings.userId, isArchived: false },
      orderBy: { createdAt: 'asc' },
      select: { id: true, number: true },
    })

    if (!defaultAccount) {
      return createErrorResponse('No account found — create an account first', 422, undefined, 'ACCOUNT_REQUIRED')
    }

    const tradeId = nanoid()
    const symbol = payload.symbol.toUpperCase()
    const entryIso = entryDate.toISOString()
    const closeIso = closeDate.toISOString()
    const tradeIdentityKey = `tv-${symbol}-${entryIso}-${tradeId}`

    await prisma.trade.create({
      data: {
        id: tradeId,
        userId: userSettings.userId,
        accountId: defaultAccount.id,
        accountNumber: defaultAccount.number,
        instrument: symbol,
        symbol,
        side: payload.side,
        entryPrice: String(payload.entry_price),
        closePrice: String(payload.close_price),
        entryPriceValue: payload.entry_price,
        closePriceValue: payload.close_price,
        quantity: payload.quantity,
        pnl: payload.pnl,
        entryDate: entryIso,
        closeDate: closeIso,
        entryTime: entryDate,
        exitTime: closeDate,
        stopLoss: payload.stop_loss ? String(payload.stop_loss) : null,
        stopLossValue: payload.stop_loss ?? null,
        takeProfit: payload.take_profit ? String(payload.take_profit) : null,
        takeProfitValue: payload.take_profit ?? null,
        comment: payload.comment || 'Imported via TradingView webhook',
        tradeIdentityKey,
        timeInPosition: Math.max(0, Math.floor((closeDate.getTime() - entryDate.getTime()) / 1000)),
      },
    })

    return createSuccessResponse({ tradeId }, `Trade imported: ${symbol} ${payload.side}`)
  } catch (err: any) {
    logger.error('TradingView webhook import failed', { error: err?.message }, 'api')
    return createErrorResponse('Internal server error', 500)
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
      info: 'Send a POST request with your TradingView alert payload. Get your unique webhook URL from Settings → Import → TradingView Webhook.',
    },
    { status: 405 }
  )
}
