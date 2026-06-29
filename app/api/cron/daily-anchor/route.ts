import { NextResponse } from 'next/server'
import { inngest } from '@/lib/inngest/client'
import logger from '@/lib/logger'

export async function GET(request: Request) {
  // Optional auth: verify authorization header for Vercel Cron
  if (
    process.env.CRON_SECRET &&
    request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await inngest.send({
      name: 'cron/daily-anchor-reset',
      data: {},
    })

    return NextResponse.json({ success: true, queued: true })
  } catch (error) {
    logger.error({ error, event: 'cron_failed' }, 'Failed to trigger daily anchor reset')
    return NextResponse.json({ error: 'Failed to queue job' }, { status: 500 })
  }
}
