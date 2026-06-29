import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { cleanContent } from '@/lib/utils'
import { classifyOutcome, getBreakEvenThreshold } from '@/lib/metrics/outcome'
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { getRuntimeBreakEvenThreshold } from '@/server/user-settings'
import { eq, and, ne, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const params = request.nextUrl.searchParams
    const limit = parseInt(params.get('limit') || '10')
    const latest = params.get('latest') === 'true'
    const reviewId = params.get('reviewId')

    if (reviewId) {
      const requestedReview = await db.query.WeeklyAIReview.findFirst({
        where: (table, { eq, and }) => and(eq(table.id, reviewId), eq(table.userId, internalUserId)),
      })

      if (!requestedReview) {
        return NextResponse.json({ success: true, data: [] })
      }

      const siblingReviews = await db.query.WeeklyAIReview.findMany({
        where: (table, { eq }) => and(eq(table.userId, internalUserId), ne(table.id, reviewId)),
        orderBy: (table, { desc }) => [desc(table.weekStart)],
        limit: Math.max(0, limit - 1),
      })

      return NextResponse.json({ success: true, data: [requestedReview, ...siblingReviews] })
    }

    if (latest) {
      const review = await db.query.WeeklyAIReview.findFirst({
        where: (table, { eq }) => eq(table.userId, internalUserId),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      })
      return NextResponse.json({ success: true, data: review })
    }

    const reviews = await db.query.WeeklyAIReview.findMany({
      where: (table, { eq }) => eq(table.userId, internalUserId),
      orderBy: (table, { desc }) => [desc(table.weekStart)],
      limit,
    })

    return NextResponse.json({ success: true, data: reviews })
  } catch (error: any) {
    logger.error('GET /api/v1/weekly-review failed', { error: error?.message }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitRes = await applyRateLimit(request, apiLimiter)
  if (rateLimitRes) return rateLimitRes

  const start = Date.now()

  try {
    const { internalUserId } = await getResolvedUserIdentity()

    // Calculate last week's window (Mon–Sun)
    let clientDate: string | null = null
    try {
      const body = await request.json()
      clientDate = body.clientDate
    } catch {}

    const now = clientDate ? new Date(clientDate) : new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    let lastWeekStart: Date
    let lastWeekEnd: Date

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Saturday or Sunday: review the week starting this Monday
      lastWeekStart = startOfWeek(now, { weekStartsOn: 1 })
      lastWeekEnd = endOfWeek(now, { weekStartsOn: 1 })
    } else {
      // Monday through Friday: review the week starting last Monday
      lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
      lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    }
    
    // Normalize to start and end of day
    lastWeekStart.setHours(0, 0, 0, 0)
    lastWeekEnd.setHours(23, 59, 59, 999)

    // Idempotent: return existing review if already generated
    const existing = await db.query.WeeklyAIReview.findFirst({
      where: (table, { eq, and }) => and(eq(table.userId, internalUserId), eq(table.weekStart, lastWeekStart)),
    })

    if (existing) {
      return NextResponse.json({ success: true, data: existing, cached: true })
    }

    // Fetch last week's trades
    const trades = await db.query.Trade.findMany({
      where: (table, { eq, and, gte, lte }) => and(
        eq(table.userId, internalUserId),
        gte(table.entryDate, format(lastWeekStart, 'yyyy-MM-dd')),
        lte(table.entryDate, format(lastWeekEnd, 'yyyy-MM-dd') + 'T23:59:59.999Z')
      ),
      orderBy: (table, { asc }) => [asc(table.entryDate)],
      with: { TradingModel: true },
    })

    // No trades last week → don't create a review
    if (trades.length === 0) {
      return NextResponse.json({ success: true, data: null, reason: 'no_trades' })
    }

    const breakEvenThreshold = await getRuntimeBreakEvenThreshold(internalUserId)
    const getNetPnl = (trade: any) => Number(trade.pnl || 0)
    const getOutcome = (trade: any) => classifyOutcome(getNetPnl(trade), breakEvenThreshold)

    // Compute stats
    const wins = trades.filter(t => getOutcome(t) === 'win')
    const losses = trades.filter(t => getOutcome(t) === 'loss')
    const totalPnl = trades.reduce((s, t) => s + getNetPnl(t), 0)
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0
    const grossProfit = wins.reduce((s, t) => s + getNetPnl(t), 0)
    const grossLoss = Math.abs(losses.reduce((s, t) => s + getNetPnl(t), 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0

    // P&L by day
    const pnlByDay: Record<string, { pnl: number; trades: number }> = {}
    trades.forEach(t => {
      const day = format(new Date(t.entryDate), 'EEEE')
      if (!pnlByDay[day]) pnlByDay[day] = { pnl: 0, trades: 0 }
      pnlByDay[day].pnl += getNetPnl(t)
      pnlByDay[day].trades++
    })

    const dayEntries = Object.entries(pnlByDay).sort((a, b) => b[1].pnl - a[1].pnl)
    const bestDay = dayEntries[0] || null
    const worstDay = dayEntries[dayEntries.length - 1] || null

    // P&L by instrument
    const pnlByInstrument: Record<string, { pnl: number; trades: number; wins: number }> = {}
    trades.forEach(t => {
      if (!pnlByInstrument[t.instrument]) pnlByInstrument[t.instrument] = { pnl: 0, trades: 0, wins: 0 }
      pnlByInstrument[t.instrument].pnl += getNetPnl(t)
      pnlByInstrument[t.instrument].trades++
      if (getOutcome(t) === 'win') pnlByInstrument[t.instrument].wins++
    })

    // Streak analysis
    let maxWinStreak = 0, maxLossStreak = 0, curW = 0, curL = 0
    trades.forEach(t => {
      if (getOutcome(t) === 'win') { curW++; curL = 0; maxWinStreak = Math.max(maxWinStreak, curW) }
      else if (getOutcome(t) === 'loss') { curL++; curW = 0; maxLossStreak = Math.max(maxLossStreak, curL) }
    })

    // Trades per day
    const tradingDays = new Set(trades.map(t => format(new Date(t.entryDate), 'yyyy-MM-dd'))).size
    const avgTradesPerDay = tradingDays > 0 ? trades.length / tradingDays : 0

    const keyStats = {
      totalTrades: trades.length,
      winRate: Math.round(winRate * 10) / 10,
      totalPnl: Math.round(totalPnl * 100) / 100,
      profitFactor: profitFactor === Infinity ? 999 : Math.round(profitFactor * 100) / 100,
      wins: wins.length,
      losses: losses.length,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      bestDay: bestDay ? { day: bestDay[0], pnl: Math.round(bestDay[1].pnl * 100) / 100, trades: bestDay[1].trades } : null,
      worstDay: worstDay ? { day: worstDay[0], pnl: Math.round(worstDay[1].pnl * 100) / 100, trades: worstDay[1].trades } : null,
      avgTradesPerDay: Math.round(avgTradesPerDay * 10) / 10,
      tradingDays,
      maxWinStreak,
      maxLossStreak,
      instruments: Object.entries(pnlByInstrument)
        .sort((a, b) => b[1].pnl - a[1].pnl)
        .slice(0, 5)
        .map(([name, d]) => ({ name, pnl: Math.round(d.pnl * 100) / 100, trades: d.trades, winRate: d.trades > 0 ? Math.round((d.wins / d.trades) * 1000) / 10 : 0 })),
    }

    // Build stats summary for the AI prompt
    const instrumentSummary = Object.entries(pnlByInstrument)
      .sort((a, b) => b[1].pnl - a[1].pnl)
      .map(([name, d]) => `${name}: ${d.trades} trades, $${d.pnl.toFixed(2)}, ${d.trades > 0 ? ((d.wins / d.trades) * 100).toFixed(0) : 0}% WR`)
      .join('\n')

    const daySummary = dayEntries
      .map(([day, d]) => `${day}: ${d.trades} trades, $${d.pnl.toFixed(2)}`)
      .join('\n')

    // Call AI
    const apiKey = process.env.XAI_API_KEY
    const baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1'
    const model = process.env.XAI_MODEL || 'grok-4-1-fast-reasoning'

    let aiResult: any = null

    if (apiKey) {
      try {
        const prompt = `You are a trading performance analyst writing a concise Weekly Performance Report Card.

This is NOT a deep behavioral audit. This is a short, scannable weekly summary that tells the trader:
1. How their week went (grade + one paragraph)
2. What went right (2 to 3 bullet points)
3. What went wrong (2 to 3 bullet points)
4. ONE specific focus for next week

TONE: Professional but warm. Not a drill sergeant. Think Bloomberg performance summary meets supportive mentor. Be specific with numbers.

GRADING SCALE:
A+ = Exceptional (profitable + high discipline + improving)
A  = Excellent (strongly profitable + good execution)
B+ = Good (profitable + minor issues)
B  = Above Average (slightly profitable or breakeven but disciplined)
C+ = Average (breakeven, mixed signals)
C  = Below Average (slightly negative, clear issues)
D  = Poor (negative P&L + discipline issues)
F  = Failing (large losses + no discipline)

THE DATA:

Week: ${format(lastWeekStart, 'MMM d')} to ${format(lastWeekEnd, 'MMM d, yyyy')}

Key Stats:
- Total Trades: ${keyStats.totalTrades} across ${tradingDays} trading days
- Win Rate: ${keyStats.winRate}% (${wins.length}W / ${losses.length}L)
- Total P&L: $${totalPnl.toFixed(2)}
- Profit Factor: ${profitFactor === Infinity ? 'Infinite' : profitFactor.toFixed(2)}
- Avg Win: $${avgWin.toFixed(2)} | Avg Loss: $${avgLoss.toFixed(2)}
- R:R Ratio: ${avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : 'N/A'}
- Max Win Streak: ${maxWinStreak} | Max Loss Streak: ${maxLossStreak}
- Avg Trades/Day: ${avgTradesPerDay.toFixed(1)}

By Instrument:
${instrumentSummary || 'No instrument data'}

By Day:
${daySummary || 'No daily data'}

Trade Notes (sample):
${trades.filter(t => t.comment).slice(0, 8).map(t => `${format(new Date(t.entryDate), 'EEE')}: ${t.instrument} ${t.side} $${getNetPnl(t).toFixed(2)} "${t.comment}"`).join('\n') || 'No notes'}

RESPOND WITH EXACTLY THIS JSON:
{
  "grade": "Letter grade (A+ through F)",
  "weekSummary": "One paragraph (3 to 4 sentences). Start with the verdict. Then the key takeaway. Keep it under 200 words.",
  "highlights": ["2 to 3 specific positive observations backed by numbers"],
  "lowlights": ["2 to 3 specific negative observations backed by numbers. Empty array if genuinely nothing wrong."],
  "focusNextWeek": "ONE specific, actionable, measurable thing to focus on next week. Not generic advice."
}

RULES:
- NO emojis, NO hyphens/dashes in output
- Use "negative" or "to" instead of dashes
- Output ONLY valid JSON. Nothing else.
- Be concise. This is a quick report, not an essay.`

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'You are a trading performance analyst. Write concise weekly report cards. Output ONLY valid JSON. No emojis. No dashes.'
              },
              { role: 'user', content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 1500,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content
          if (content) {
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              aiResult = cleanContent(JSON.parse(jsonMatch[0]))
            }
          }
        }
      } catch {
        // AI failed, use fallback
      }
    }

    // Fallback if AI is unavailable
    if (!aiResult) {
      const grade = totalPnl > 500 ? 'A' : totalPnl > 100 ? 'B+' : totalPnl > 0 ? 'B' : totalPnl > -100 ? 'C' : totalPnl > -500 ? 'D' : 'F'
      aiResult = {
        grade,
        weekSummary: `You completed ${trades.length} trades this week with a total P&L of $${totalPnl.toFixed(2)}. Your win rate was ${winRate.toFixed(1)}% with a profit factor of ${profitFactor === Infinity ? 'very high' : profitFactor.toFixed(2)}. ${totalPnl > 0 ? 'A profitable week overall.' : 'Work needed to get back to profitability.'}`,
        highlights: wins.length > 0 ? [`Won ${wins.length} out of ${trades.length} trades`, bestDay ? `Best day was ${bestDay[0]} with $${bestDay[1].pnl.toFixed(2)}` : 'Consistent daily trading'] : [],
        lowlights: losses.length > 0 ? [`${losses.length} losing trades`, worstDay ? `Worst day was ${worstDay[0]} with $${worstDay[1].pnl.toFixed(2)}` : 'Room for improvement'] : [],
        focusNextWeek: totalPnl > 0 ? 'Maintain your current discipline and try to reduce your largest loss size.' : 'Focus on taking fewer, higher quality setups. Quality over quantity.',
      }
    }

    // Store in DB
    const review = (await db.insert(schema.WeeklyAIReview).values({
      userId: internalUserId,
      weekStart: lastWeekStart,
      weekEnd: lastWeekEnd,
      summary: aiResult.weekSummary || '',
      highlights: aiResult.highlights || [],
      lowlights: aiResult.lowlights || [],
      stats: keyStats,
      grade: aiResult.grade || '',
      focusNextWeek: aiResult.focusNextWeek || null,
    }).returning())[0]

    // Create notification
    await db.insert(schema.Notification).values({
      userId: internalUserId,
      type: 'WEEKLY_PERFORMANCE',
      title: `Weekly Report: ${format(lastWeekStart, 'MMM d')} – ${format(lastWeekEnd, 'MMM d')} | Grade: ${aiResult.grade || '?'}`,
      message: (aiResult.weekSummary || '').slice(0, 500),
      data: { reviewId: review.id },
      actionRequired: false,
    })

    logger.info('POST /api/v1/weekly-review', { latencyMs: Date.now() - start, grade: aiResult.grade }, 'api')
    return NextResponse.json({ success: true, data: review })
  } catch (error: any) {
    logger.error('POST /api/v1/weekly-review failed', { error: error?.message, latencyMs: Date.now() - start }, 'api')
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Unique constraint = already exists (race condition)
    if (error.code === '23505') {
      const existing = await db.query.WeeklyAIReview.findFirst({
        where: (table, { eq }) => eq(table.userId, (error as any)._userId),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      })
      return NextResponse.json({ success: true, data: existing, cached: true })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}