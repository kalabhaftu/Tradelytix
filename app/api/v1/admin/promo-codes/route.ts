/**
 * Admin Promo Codes API
 * GET  - List promo codes
 * POST - Create promo code
 * PATCH - Update/disable promo code
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const codes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { PromoRedemption: true } },
      },
    })

    return NextResponse.json({ success: true, data: codes })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ success: false, error: msg }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await requireAdmin()
    const body = await request.json()
    const { code, type, value, maxUses, validFrom, validUntil, applicability } = body

    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: code, type, value' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Promo code already exists' }, { status: 409 })
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        applicability: applicability || 'signup_only',
        value: parseFloat(value),
        maxUses: maxUses ? parseInt(maxUses) : null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        createdBy: identity.internalUserId,
      },
    })

    return NextResponse.json({ success: true, data: promo })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { id, isActive, maxUses, validUntil, applicability } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing promo code id' }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (maxUses !== undefined) updateData.maxUses = maxUses ? parseInt(maxUses) : null
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null
    if (applicability !== undefined) updateData.applicability = applicability

    const promo = await prisma.promoCode.update({ where: { id }, data: updateData })
    return NextResponse.json({ success: true, data: promo })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
