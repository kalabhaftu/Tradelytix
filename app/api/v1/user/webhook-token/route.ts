/**
 * Webhook Token Management
 * GET  — returns current webhook token (masked)
 * POST — generates/regenerates the webhook token
 * DELETE — revokes the webhook token
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const settings = await prisma.userSettings.findUnique({
      where: { userId: internalUserId },
      select: { webhookToken: true },
    })
    const token = settings?.webhookToken
    return NextResponse.json({
      hasToken: Boolean(token),
      tokenPreview: token ? `${token.substring(0, 8)}...${token.substring(token.length - 4)}` : null,
    })
  } catch (err) {
    console.error('[Webhook Token GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const newToken = `dlx_${nanoid(32)}`

    await prisma.userSettings.upsert({
      where: { userId: internalUserId },
      update: { webhookToken: newToken },
      create: {
        userId: internalUserId,
        webhookToken: newToken,
      },
    })

    return NextResponse.json({ token: newToken, generated: true })
  } catch (err) {
    console.error('[Webhook Token POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const { internalUserId } = await getResolvedUserIdentity()
    await prisma.userSettings.update({
      where: { userId: internalUserId },
      data: { webhookToken: null },
    })
    return NextResponse.json({ revoked: true })
  } catch (err) {
    console.error('[Webhook Token DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
