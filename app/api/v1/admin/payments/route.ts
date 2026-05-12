/**
 * Admin Payments API
 * GET - List payment and invoice records with user info.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10)
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10)
    const status = request.nextUrl.searchParams.get('status')

    const where = status ? { providerStatus: status } : {}

    const [payments, total] = await Promise.all([
      prisma.paymentRecord.findMany({
        where,
        include: {
          Subscription: {
            include: {
              User: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
          },
          PromoCode: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentRecord.count({ where }),
    ])

    return NextResponse.json({ success: true, data: payments, total, page, limit })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unauthorized'
    const statusCode = msg.includes('Unauthorized') || msg.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status: statusCode })
  }
}
