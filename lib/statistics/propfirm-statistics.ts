import { prisma } from '@/lib/prisma'
import {
  calculatePropFirmPhaseMetrics,
  derivePropFirmLifecycleStatus,
  isFundedPhaseForEvaluation,
  resolveReportPhase,
  summarizePhaseHistory,
} from '@/lib/prop-firm/reporting'

type PhaseWithRelations = {
  id: string
  masterAccountId: string
  phaseNumber: number
  phaseId: string | null
  status: string
  profitTargetPercent: number
  dailyDrawdownPercent: number
  maxDrawdownPercent: number
  maxDrawdownType: string
  minTradingDays: number
  timeLimitDays: number | null
  consistencyRulePercent: number
  profitSplitPercent: number | null
  payoutCycleDays: number | null
  startDate: Date
  endDate: Date | null
  Trade: Array<any>
  Payout: Array<any>
  BreachRecord: Array<{ id: string }>
}

type MasterWithRelations = {
  id: string
  userId: string
  accountName: string
  propFirmName: string
  accountSize: number
  evaluationType: string
  currentPhase: number
  createdAt: Date
  status: string
  isArchived: boolean
  PhaseAccount: PhaseWithRelations[]
  Payout: Array<{ id: string; amount: number; status: string }>
}

export interface PropFirmAccountDTO {
  id: string
  masterId: string
  accountName: string
  propFirmName: string
  accountSize: number
  evaluationType: string
  masterStatus: string
  lifecycleStatus: 'active' | 'funded' | 'failed' | 'passed' | 'pending_approval'
  currentPhaseNumber: number | null
  currentPhaseStatus: string | null
  isFundedStage: boolean
  grossPnL: number
  netPnL: number
  profitTargetAmount: number
  profitTargetProgressPct: number
  tradeCount: number
  activeDays: number
  winRate: string
  profitFactor: string
  expectancy: string
  peakProfit: number
  maxDrawdown: number
  maxDrawdownPct: string
  breachCount: number
  totalPayouts: number
  durationDays: number
  phaseHistory: Array<{
    id: string
    phaseNumber: number
    phaseId: string | null
    status: string
    isFundedStage: boolean
  }>
}

export interface PropFirmSummaryDTO {
  totalAccounts: number
  activeAccounts: number
  fundedAccounts: number
  failedAccounts: number
  passedPhases: number
  totalNetPnL: number
  totalGrossPnL: number
  totalPayoutsReceived: number
  totalBreaches: number
  accounts: PropFirmAccountDTO[]
}

function toDurationDays(startDate?: Date | null, endDate?: Date | null) {
  if (!startDate) return 0
  const start = startDate.getTime()
  const end = (endDate ?? new Date()).getTime()
  const delta = Math.max(0, end - start)
  return Math.max(1, Math.round(delta / (1000 * 60 * 60 * 24)))
}

function getProfitTargetAmount(accountSize: number, phase?: Pick<PhaseWithRelations, 'profitTargetPercent'> | null) {
  if (!phase?.profitTargetPercent) return 0
  return accountSize * (phase.profitTargetPercent / 100)
}

function normalizeProgress(current: number, target: number) {
  if (target <= 0) return 100
  return Math.max(0, Math.min(100, (current / target) * 100))
}

export async function fetchPropFirmReportMasters(userId: string): Promise<MasterWithRelations[]> {
  return prisma.masterAccount.findMany({
    where: {
      userId,
      isArchived: false,
    },
    select: {
      id: true,
      userId: true,
      accountName: true,
      propFirmName: true,
      accountSize: true,
      evaluationType: true,
      currentPhase: true,
      createdAt: true,
      status: true,
      isArchived: true,
      Payout: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
      PhaseAccount: {
        orderBy: {
          phaseNumber: 'asc',
        },
        select: {
          id: true,
          masterAccountId: true,
          phaseNumber: true,
          phaseId: true,
          status: true,
          profitTargetPercent: true,
          dailyDrawdownPercent: true,
          maxDrawdownPercent: true,
          maxDrawdownType: true,
          minTradingDays: true,
          timeLimitDays: true,
          consistencyRulePercent: true,
          profitSplitPercent: true,
          payoutCycleDays: true,
          startDate: true,
          endDate: true,
          Trade: {
            select: {
              id: true,
              phaseAccountId: true,
              entryId: true,
              instrument: true,
              symbol: true,
              side: true,
              pnl: true,
              commission: true,
              quantity: true,
              timeInPosition: true,
              entryDate: true,
              closeDate: true,
              entryTime: true,
              exitTime: true,
              entryPrice: true,
              closePrice: true,
              accountNumber: true,
            },
            orderBy: {
              exitTime: 'asc',
            },
          },
          Payout: {
            select: {
              id: true,
              amount: true,
              status: true,
            },
          },
          BreachRecord: {
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  }) as Promise<MasterWithRelations[]>
}

export function mapMasterAccountToReportAccount(master: MasterWithRelations): PropFirmAccountDTO {
  const resolvedPhase = resolveReportPhase(master as any)
  const lifecycleStatus = derivePropFirmLifecycleStatus(master as any, resolvedPhase as any)
  const phaseHistory = summarizePhaseHistory(master as any)
  const isFundedStage = resolvedPhase
    ? isFundedPhaseForEvaluation(master.evaluationType, resolvedPhase.phaseNumber)
    : master.status === 'funded'
  const phaseMetrics = resolvedPhase
    ? calculatePropFirmPhaseMetrics(resolvedPhase as any, master.accountSize)
    : {
        groupedTrades: [],
        tradeCount: 0,
        activeDays: 0,
        grossPnl: 0,
        netPnl: 0,
        winRate: '0.0',
        profitFactor: '0.00',
        expectancy: '0.00',
        peakProfit: 0,
        maxDrawdown: 0,
        maxDrawdownPct: '0.00',
        totalPayouts: 0,
        breachCount: 0,
      }

  const profitTargetAmount = getProfitTargetAmount(master.accountSize, resolvedPhase)

  return {
    id: master.id,
    masterId: master.id,
    accountName: master.accountName,
    propFirmName: master.propFirmName,
    accountSize: master.accountSize,
    evaluationType: master.evaluationType,
    masterStatus: master.status,
    lifecycleStatus,
    currentPhaseNumber: resolvedPhase?.phaseNumber ?? null,
    currentPhaseStatus: resolvedPhase?.status ?? null,
    isFundedStage,
    grossPnL: phaseMetrics.grossPnl,
    netPnL: phaseMetrics.netPnl,
    profitTargetAmount,
    profitTargetProgressPct: normalizeProgress(phaseMetrics.grossPnl, profitTargetAmount),
    tradeCount: phaseMetrics.tradeCount,
    activeDays: phaseMetrics.activeDays,
    winRate: phaseMetrics.winRate,
    profitFactor: phaseMetrics.profitFactor,
    expectancy: phaseMetrics.expectancy,
    peakProfit: phaseMetrics.peakProfit,
    maxDrawdown: phaseMetrics.maxDrawdown,
    maxDrawdownPct: phaseMetrics.maxDrawdownPct,
    breachCount: phaseMetrics.breachCount,
    totalPayouts: phaseMetrics.totalPayouts,
    durationDays: toDurationDays(resolvedPhase?.startDate ?? master.createdAt, resolvedPhase?.endDate ?? null),
    phaseHistory,
  }
}

export async function calculatePropFirmStatistics(userId: string): Promise<PropFirmSummaryDTO> {
  const masters = await fetchPropFirmReportMasters(userId)
  const accounts = masters.map(mapMasterAccountToReportAccount)

  return {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter((account) => account.lifecycleStatus === 'active').length,
    fundedAccounts: accounts.filter((account) => account.lifecycleStatus === 'funded').length,
    failedAccounts: accounts.filter((account) => account.lifecycleStatus === 'failed').length,
    passedPhases: accounts.reduce(
      (sum, account) => sum + account.phaseHistory.filter((phase) => phase.status === 'passed').length,
      0
    ),
    totalNetPnL: accounts.reduce((sum, account) => sum + account.netPnL, 0),
    totalGrossPnL: accounts.reduce((sum, account) => sum + account.grossPnL, 0),
    totalPayoutsReceived: accounts.reduce((sum, account) => sum + account.totalPayouts, 0),
    totalBreaches: accounts.reduce((sum, account) => sum + account.breachCount, 0),
    accounts,
  }
}
