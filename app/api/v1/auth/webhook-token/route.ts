import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { internalUserId } = await getResolvedUserIdentity()

    const settings = await prisma.userSettings.findUnique({
      where: { userId: internalUserId },
      select: { webhookToken: true },
    })

    const token = settings?.webhookToken ?? null
    return NextResponse.json({
      hasToken: Boolean(token),
      token,
    })
  } catch (err) {
    console.error('[webhook-token GET]', err)
    return NextResponse.json({ error: 'Failed to fetch webhook token' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const token = randomUUID()

    await prisma.userSettings.upsert({
      where: { userId: internalUserId },
      create: { userId: internalUserId, webhookToken: token },
      update: { webhookToken: token },
    })

    return NextResponse.json({ token })
  } catch (err) {
    console.error('[webhook-token POST]', err)
    return NextResponse.json({ error: 'Failed to regenerate webhook token' }, { status: 500 })
  }
}

