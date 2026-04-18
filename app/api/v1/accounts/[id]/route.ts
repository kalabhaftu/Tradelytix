import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { logActivity, getClientIp } from '@/lib/activity-logger'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimitResponse = await applyRateLimit(request, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id: accountId } = await params
    const internalUserId = identity.internalUserId

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: internalUserId,
      },
      include: {
        _count: {
          select: {
            Trade: true
          }
        }
      }
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    const trades = await prisma.trade.findMany({
      where: {
        accountId: account.id,
      },
      select: {
        pnl: true,
        commission: true,
        entryDate: true,
      },
      orderBy: {
        entryDate: 'desc'
      }
    })

    const transactions = await prisma.liveAccountTransaction.findMany({
      where: {
        accountId: account.id,
      },
      select: {
        amount: true,
      }
    })

    const profitLoss = trades.reduce(
      (sum: number, trade: { pnl: number; commission: number | null }) => {
        return sum + trade.pnl
      },
      0
    )

    const totalTransactions = transactions.reduce(
      (sum: number, tx: { amount: number }) => sum + tx.amount,
      0
    )

    const currentEquity = account.startingBalance + profitLoss + totalTransactions
    const lastTradeDate = trades.length > 0 ? trades[0].entryDate : null

    return NextResponse.json({
      success: true,
      data: {
        id: account.id,
        number: account.number,
        name: account.name,
        broker: account.broker,
        accountType: 'live',
        displayName: account.name || account.number,
        startingBalance: account.startingBalance,
        currentEquity,
        profitLoss,
        status: 'active',
        tradeCount: account._count.Trade,
        lastTradeDate,
        createdAt: account.createdAt,
      }
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch account' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const rateLimitResponse = await applyRateLimit(request, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const internalUserId = identity.internalUserId
    const { id: accountId } = await params
    const body = await request.json()
    const { name, broker, isArchived } = body

    const existingAccount = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: internalUserId,
      }
    })

    if (!existingAccount) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (typeof isArchived === 'boolean') {
      updateData.isArchived = isArchived
    }

    if (name !== undefined || broker !== undefined) {
      if (!name || !broker) {
        return NextResponse.json(
          { success: false, error: 'Name and broker are required for account updates' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
      updateData.broker = broker.trim()
    }

    const updatedAccount = await prisma.account.update({
      where: {
        id: accountId,
      },
      data: updateData
    })

    if (typeof isArchived === 'boolean') {
      const { invalidateUserCaches } = await import('@/server/accounts')
      await invalidateUserCaches(internalUserId)
    }

    const action = typeof isArchived === 'boolean'
      ? (isArchived ? 'ACCOUNT_ARCHIVED' : 'ACCOUNT_UNARCHIVED')
      : 'ACCOUNT_RENAMED'

    logActivity({
      userId: internalUserId,
      action,
      entity: 'Account',
      entityId: accountId,
      metadata: { updatedFields: Object.keys(updateData), accountNumber: updatedAccount.number },
      ipAddress: getClientIp(request),
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAccount.id,
        number: updatedAccount.number,
        name: updatedAccount.name,
        broker: updatedAccount.broker,
        displayName: updatedAccount.name || updatedAccount.number,
        startingBalance: updatedAccount.startingBalance,
        isArchived: updatedAccount.isArchived,
      }
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update account' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const rateLimitResponse = await applyRateLimit(request, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const identity = await getResolvedUserIdentitySafe()
    if (!identity) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const internalUserId = identity.internalUserId
    const { id: accountId } = await params

    const existingAccount = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: internalUserId,
      }
    })

    if (!existingAccount) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    await prisma.account.delete({
      where: {
        id: accountId,
      }
    })

    const { invalidateUserCaches } = await import('@/server/accounts')
    await invalidateUserCaches(internalUserId)

    logActivity({
      userId: internalUserId,
      action: 'ACCOUNT_DELETED',
      entity: 'Account',
      entityId: accountId,
      metadata: { accountNumber: existingAccount.number },
      ipAddress: getClientIp(request),
    })

    return NextResponse.json({
      success: true,
      message: 'Account and all associated trades deleted successfully'
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
