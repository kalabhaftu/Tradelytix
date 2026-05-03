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
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, apiLimiter)
  if (rl) return rl

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { token, symbol, side, entry_price, close_price, quantity, pnl, entry_time, close_time, stop_loss, take_profit, comment } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing webhook token' }, { status: 401 })
    }

    // Look up user by webhook token stored in their settings
    const userSettings = await prisma.userSettings.findFirst({
      where: { webhookToken: token },
      select: { userId: true },
    }).catch(() => null)

    if (!userSettings) {
      return NextResponse.json({ error: 'Invalid or expired webhook token' }, { status: 401 })
    }

    const { userId } = userSettings

    // Find default account for this user
    const defaultAccount = await prisma.account.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, number: true },
    })

    if (!defaultAccount) {
      return NextResponse.json({ error: 'No account found — create an account first' }, { status: 422 })
    }

    if (!symbol || !side || entry_price === undefined || close_price === undefined) {
      return NextResponse.json({ error: 'Missing required fields: symbol, side, entry_price, close_price' }, { status: 400 })
    }

    const entryDate = entry_time ? new Date(entry_time).toISOString() : new Date().toISOString()
    const closeDate = close_time ? new Date(close_time).toISOString() : new Date().toISOString()
    const netPnl = typeof pnl === 'number' ? pnl : 0

    const tradeId = nanoid()
    const tradeIdentityKey = `tv-${symbol}-${entryDate}-${tradeId}`

    await prisma.trade.create({
      data: {
        id: tradeId,
        userId,
        accountId: defaultAccount.id,
        accountNumber: defaultAccount.number,
        instrument: String(symbol).toUpperCase(),
        symbol: String(symbol).toUpperCase(),
        side: String(side).toUpperCase(),
        entryPrice: String(entry_price),
        closePrice: String(close_price),
        entryPriceValue: Number(entry_price),
        closePriceValue: Number(close_price),
        quantity: Number(quantity) || 1,
        pnl: netPnl,
        entryDate,
        closeDate,
        entryTime: new Date(entryDate),
        exitTime: new Date(closeDate),
        stopLoss: stop_loss ? String(stop_loss) : null,
        stopLossValue: stop_loss ? Number(stop_loss) : null,
        takeProfit: take_profit ? String(take_profit) : null,
        takeProfitValue: take_profit ? Number(take_profit) : null,
        comment: comment ? String(comment) : 'Imported via TradingView webhook',
        tradeIdentityKey,
        timeInPosition: 0,
      },
    })

    return NextResponse.json({
      success: true,
      tradeId,
      message: `Trade imported: ${symbol} ${side} — P&L: $${netPnl.toFixed(2)}`,
    })
  } catch (err: any) {
    console.error('[TradingView Webhook] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET — returns 405 with instructions
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      info: 'Send a POST request with your TradingView alert payload. Get your unique webhook URL from Settings → Import → TradingView Webhook.',
    },
    { status: 405 }
  )
}
