import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import {
  fetchPropFirmReportMasters,
  mapMasterAccountToReportAccount,
} from '@/lib/statistics/propfirm-statistics'

function parseArg(name: string) {
  const args = process.argv.slice(2)
  const index = args.findIndex((arg) => arg === `--${name}`)
  return index >= 0 ? args[index + 1] : undefined
}

function money(value: number) {
  return `${value >= 0 ? '+' : '-'}$${Math.abs(value).toFixed(2)}`
}

async function main() {
  const email = parseArg('email')
  const userId = parseArg('user-id')

  if (!email && !userId) {
    throw new Error('Pass --email or --user-id')
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        email ? { email } : undefined,
        userId ? { id: userId } : undefined,
      ].filter(Boolean) as any,
    },
    select: {
      id: true,
      email: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const masters = await fetchPropFirmReportMasters(user.id)
  const reportAccounts = masters.map(mapMasterAccountToReportAccount)

  const oldCounts = {
    totalAccounts: masters.length,
    activeAccounts: masters.filter((master) => master.status === 'active').length,
    fundedAccounts: masters.filter((master) => master.status === 'funded').length,
    failedAccounts: masters.filter((master) => master.status === 'failed').length,
    passedPhases: masters.reduce(
      (sum, master) => sum + master.PhaseAccount.filter((phase) => phase.status === 'passed').length,
      0
    ),
    renderedCards: masters.reduce((sum, master) => sum + master.PhaseAccount.length, 0),
  }

  const newCounts = {
    totalAccounts: reportAccounts.length,
    activeAccounts: reportAccounts.filter((account) => account.lifecycleStatus === 'active').length,
    fundedAccounts: reportAccounts.filter((account) => account.lifecycleStatus === 'funded').length,
    failedAccounts: reportAccounts.filter((account) => account.lifecycleStatus === 'failed').length,
    passedPhases: reportAccounts.reduce(
      (sum, account) => sum + account.phaseHistory.filter((phase) => phase.status === 'passed').length,
      0
    ),
    renderedCards: reportAccounts.length,
  }

  console.log(`Prop-firm audit for ${user.email} (${user.id})`)
  console.log('')
  console.log('Old funded-tab counts:')
  console.table(oldCounts)
  console.log('Corrected funded-tab counts:')
  console.table(newCounts)

  console.log('Per-master comparison:')
  console.table(
    reportAccounts.map((account) => {
      const master = masters.find((item) => item.id === account.masterId)!
      return {
        accountName: account.accountName,
        propFirm: account.propFirmName,
        masterStatus: master.status,
        currentPhaseConfig: master.currentPhase,
        resolvedPhase: account.currentPhaseNumber,
        resolvedPhaseStatus: account.currentPhaseStatus,
        lifecycleStatus: account.lifecycleStatus,
        grossPnL: money(account.grossPnL),
        netPnL: money(account.netPnL),
        progress: `${account.profitTargetProgressPct.toFixed(1)}%`,
      }
    })
  )

  console.log('Per-phase history:')
  for (const account of reportAccounts) {
    console.log(`- ${account.accountName} (${account.propFirmName})`)
    account.phaseHistory.forEach((phase) => {
      console.log(
        `  Phase ${phase.phaseNumber}${phase.isFundedStage ? ' (Funded)' : ''}: ${phase.status}`
      )
    })
  }

  console.log('')
  console.log('Gross vs net target progress:')
  console.table(
    reportAccounts.map((account) => ({
      accountName: account.accountName,
      propFirm: account.propFirmName,
      currentPhase: account.currentPhaseNumber,
      target: account.profitTargetAmount ? `$${account.profitTargetAmount.toFixed(2)}` : '$0.00',
      grossPnL: money(account.grossPnL),
      netPnL: money(account.netPnL),
      progressPct: account.profitTargetProgressPct.toFixed(1),
    }))
  )

  const mavenAccount = reportAccounts.find(
    (account) =>
      account.propFirmName.toLowerCase().includes('maven') &&
      account.accountName.toLowerCase().includes('maven 5k #1')
  )

  if (mavenAccount) {
    console.log('')
    console.log('Focused check: Maven Trading / Maven 5k #1')
    console.table([
      {
        lifecycleStatus: mavenAccount.lifecycleStatus,
        currentPhase: mavenAccount.currentPhaseNumber,
        target: `$${mavenAccount.profitTargetAmount.toFixed(2)}`,
        grossPnL: money(mavenAccount.grossPnL),
        netPnL: money(mavenAccount.netPnL),
        progressPct: `${mavenAccount.profitTargetProgressPct.toFixed(1)}%`,
        trades: mavenAccount.tradeCount,
        activeDays: mavenAccount.activeDays,
      },
    ])
  } else {
    console.log('Focused check: Maven Trading / Maven 5k #1 not found')
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
