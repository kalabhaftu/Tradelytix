import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    runtime: 'nodejs',
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION || 'unknown',
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
    }
  })
}
