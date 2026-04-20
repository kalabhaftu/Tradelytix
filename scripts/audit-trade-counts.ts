import { prisma } from '@/lib/prisma'
import { TRADE_COUNT_SELECT, buildGroupedTradeCountSummary } from '@/lib/trade-counts'

function parseArgs() {
  const args = process.argv.slice(2)
  const parsed: Record<string, string> = {}

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) {
      parsed[key] = 'true'
      continue
    }
    parsed[key] = value
    index += 1
  }

  return parsed
}

async function main() {
  const args = parseArgs()
  const email = args.email
  const userId = args.userId

  if (!email && !userId) {
    throw new Error('Provide --email <email> or --userId <uuid>')
  }

  const user = await prisma.user.findFirst({
    where: email ? { email } : { id: userId },
    select: { id: true, email: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const [trades, liveAccounts, masterAccounts] = await Promise.all([
    prisma.trade.findMany({
      where: { userId: user.id },
      select: TRADE_COUNT_SELECT,
      orderBy: { entryDate: 'asc' },
    }),
    prisma.account.findMany({
      where: { userId: user.id },
      select: { id: true, number: true, name: true, isArchived: true },
    }),
    prisma.masterAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        accountName: true,
        propFirmName: true,
        isArchived: true,
        PhaseAccount: {
          select: { id: true, phaseId: true, phaseNumber: true, status: true },
          orderBy: { phaseNumber: 'asc' },
        },
      },
    }),
  ])

  const summary = buildGroupedTradeCountSummary(trades as any)

  const liveAccountCounts = liveAccounts.map((account) => ({
    id: account.id,
    number: account.number,
    name: account.name,
    isArchived: account.isArchived,
    groupedTrades: summary.groupedCountByLiveAccountNumber.get(account.number) || 0,
  }))

  const masterAccountCounts = masterAccounts.map((masterAccount) => {
    const phases = masterAccount.PhaseAccount.map((phase) => ({
      id: phase.id,
      phaseId: phase.phaseId,
      phaseNumber: phase.phaseNumber,
      status: phase.status,
      groupedTrades:
        summary.groupedCountByPhaseAccountId.get(phase.id) ||
        summary.groupedCountByAccountNumber.get(phase.phaseId) ||
        0,
    }))

    return {
      id: masterAccount.id,
      accountName: masterAccount.accountName,
      propFirmName: masterAccount.propFirmName,
      isArchived: masterAccount.isArchived,
      groupedTrades: phases.reduce((sum, phase) => sum + phase.groupedTrades, 0),
      phases,
    }
  })

  const output = {
    user,
    rawTradeRowCount: summary.rawTradeRowCount,
    groupedTradeCount: summary.groupedTradeCount,
    partialExecutionGroupCount: summary.partialExecutionGroupCount,
    liveAccountCounts,
    masterAccountCounts,
  }

  console.log(JSON.stringify(output, null, 2))
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
