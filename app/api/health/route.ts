import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { redis } from '@/lib/cache/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const status = {
    database: 'down',
    redis: 'down',
    overall: 'unhealthy',
    timestamp: new Date().toISOString()
  }

  try {
    // Check DB
    await db.execute('SELECT 1')
    status.database = 'up'
  } catch (err) {}

  try {
    // Check Redis
    const ping = await redis.ping()
    if (ping === 'PONG') {
      status.redis = 'up'
    }
  } catch (err) {}

  if (status.database === 'up' && status.redis === 'up') {
    status.overall = 'healthy'
  }

  return NextResponse.json(status, {
    status: status.overall === 'healthy' ? 200 : 503
  })
}
