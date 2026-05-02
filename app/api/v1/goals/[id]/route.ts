import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentity } from '@/server/user-identity'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const body = await req.json()

    const goal = await prisma.userGoal.findFirst({
      where: { id: params.id, userId: internalUserId },
    })
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.userGoal.update({
      where: { id: params.id },
      data: {
        ...(body.currentValue !== undefined && { currentValue: Number(body.currentValue) }),
        ...(body.isCompleted !== undefined && {
          isCompleted: Boolean(body.isCompleted),
          completedAt: body.isCompleted ? new Date() : null,
        }),
        ...(body.title && { title: body.title }),
        ...(body.targetValue !== undefined && { targetValue: Number(body.targetValue) }),
      },
    })
    return NextResponse.json({ goal: updated })
  } catch (err) {
    console.error('[Goals PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { internalUserId } = await getResolvedUserIdentity()
    const goal = await prisma.userGoal.findFirst({
      where: { id: params.id, userId: internalUserId },
    })
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.userGoal.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Goals DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
