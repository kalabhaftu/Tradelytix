import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ insightId: string }> }
) {
  const rl = await applyRateLimit(request, apiLimiter)
  if (rl) return rl

  const identity = await getResolvedUserIdentitySafe()
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = identity.internalUserId

  const { insightId } = await params

  try {
    const insight = await prisma.aISavedInsight.findFirst({
      where: {
        id: insightId,
        userId,
      },
    })

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 })
    }

    await prisma.aISavedInsight.delete({
      where: { id: insightId },
    })

    return NextResponse.json({ success: true, message: 'Insight deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete insight' }, { status: 500 })
  }
}
