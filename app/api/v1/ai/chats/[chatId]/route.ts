import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const rl = await applyRateLimit(request, apiLimiter)
  if (rl) return rl

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = identity.internalUserId

  const { chatId } = await params

  try {
    const chat = await prisma.aIChat.findFirst({
      where: {
        id: chatId,
        userId,
        isDeleted: false,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: chat })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const rl = await applyRateLimit(request, apiLimiter)
  if (rl) return rl

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = identity.internalUserId

  const { chatId } = await params

  try {
    const chat = await prisma.aIChat.findFirst({
      where: {
        id: chatId,
        userId,
        isDeleted: false,
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, isPinned, isArchived } = body

    const updatedChat = await prisma.aIChat.update({
      where: { id: chatId },
      data: {
        ...(title !== undefined && { title }),
        ...(isPinned !== undefined && { isPinned }),
        ...(isArchived !== undefined && { isArchived }),
      },
      select: {
        id: true,
        title: true,
        isPinned: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ success: true, data: updatedChat })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const rl = await applyRateLimit(request, apiLimiter)
  if (rl) return rl

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = identity.internalUserId

  const { chatId } = await params

  try {
    const chat = await prisma.aIChat.findFirst({
      where: {
        id: chatId,
        userId,
        isDeleted: false,
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    await prisma.aIChat.update({
      where: { id: chatId },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true, message: 'Chat deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
