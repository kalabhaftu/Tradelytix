/**
 * Admin Free Access API
 * GET  - List all free access invites
 * POST - Grant free access by email
 * PATCH - Revoke free access
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/server/admin-auth'
import { prisma } from '@/lib/prisma'
import { grantFreeAccess, revokeFreeAccess } from '@/lib/services/subscription'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const invites = await prisma.freeAccessInvite.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: invites })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ success: false, error: msg }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await requireAdmin()
    const body = await request.json()
    const { email, type, expiresAt, note } = body

    if (!email || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, type' },
        { status: 400 }
      )
    }

    // Admin must always specify — validate type requires expiresAt for until_date
    if (type === 'until_date' && !expiresAt) {
      return NextResponse.json(
        { success: false, error: 'expiresAt is required for until_date type' },
        { status: 400 }
      )
    }

    const invite = await grantFreeAccess({
      email,
      type,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      note,
      grantedBy: identity.internalUserId,
    })

    return NextResponse.json({ success: true, data: invite })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { email, action } = body

    if (!email || !action) {
      return NextResponse.json({ success: false, error: 'Missing email or action' }, { status: 400 })
    }

    if (action === 'revoke') {
      const result = await revokeFreeAccess(email)
      if (!result) {
        return NextResponse.json({ success: false, error: 'Invite not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
