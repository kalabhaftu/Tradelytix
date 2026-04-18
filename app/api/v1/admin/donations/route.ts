import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/server/admin-auth'
import { applyRateLimit, adminLimiter } from '@/lib/rate-limiter'
import { sanitizeErrorMessage, getErrorStatusCode } from '@/lib/api-error'

export async function GET(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()

    const addresses = await prisma.donationAddress.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({ success: true, data: addresses })
  } catch (error: any) {
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req, adminLimiter)
  if (rl) return rl

  try {
    await requireAdmin()
    const body = await req.json()

    if (!body.token || !body.network || !body.address) {
      return NextResponse.json({ success: false, error: 'token, network, and address are required' }, { status: 400 })
    }

    const address = await prisma.donationAddress.create({
      data: {
        token: body.token.trim(),
        network: body.network.trim(),
        address: body.address.trim(),
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    })

    return NextResponse.json({ success: true, data: address })
  } catch (error: any) {
    const status = getErrorStatusCode(error)
    return NextResponse.json({ success: false, error: sanitizeErrorMessage(error) }, { status })
  }
}
