/**
 * Admin Subscriptions API
 * GET  - List all subscriptions with user info
 * PATCH - Admin actions (extend, cancel, change status)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
    const status = request.nextUrl.searchParams.get('status')

    const where = status ? { Subscription: { status: status as any } } : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          Subscription: {
            include: {
              PaymentRecord: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { providerStatus: true, amountUsd: true, paidAt: true },
              },
              PromoCode: true,
              FreeAccess: true,
            },
          },
        },
        orderBy: { email: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ success: true, data: users, total, page, limit })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unauthorized'
    const status = msg.includes('Unauthorized') || msg.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { subscriptionId, action, ...params } = body

    if (!subscriptionId || !action) {
      return NextResponse.json({ success: false, error: 'Missing subscriptionId or action' }, { status: 400 })
    }

    const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } })
    if (!subscription) {
      return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 })
    }

    switch (action) {
      case 'activate': {
        const periodEnd = params.periodEnd ? new Date(params.periodEnd) : new Date(Date.now() + 30 * 86400000)
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
            nextPaymentDue: periodEnd,
          },
        })
        break
      }
      case 'cancel':
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'cancelled', cancelledAt: new Date() },
        })
        break
      case 'expire':
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'expired' },
        })
        break
      case 'extend': {
        const days = parseInt(params.days || '30')
        const currentEnd = subscription.currentPeriodEnd || new Date()
        const newEnd = new Date(currentEnd.getTime() + days * 86400000)
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { currentPeriodEnd: newEnd, nextPaymentDue: newEnd, status: 'active' },
        })
        break
      }
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }

    const updated = await prisma.subscription.findUnique({ where: { id: subscriptionId } })
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed'
    const status = msg.includes('Unauthorized') || msg.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ success: false, error: msg }, { status })
  }
}
