import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, publicLimiter } from '@/lib/rate-limiter'

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, publicLimiter)
  if (rl) return rl

  try {
    const addresses = await prisma.donationAddress.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { token: true, network: true, address: true },
    })

    return NextResponse.json({ success: true, data: addresses })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch addresses' }, { status: 500 })
  }
}
