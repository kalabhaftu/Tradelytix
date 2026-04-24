import { prisma } from '@/lib/prisma'
import { getResolvedUserIdentitySafe } from '@/server/user-identity'
import { cloneDefaultTemplateLayout } from '@/lib/dashboard/default-template-layout'
import { TRADE_COUNT_SELECT, buildGroupedTradeCountSummary } from '@/lib/trade-counts'
import { USER_SETTINGS_SELECT, mergeUserSettings } from '@/lib/user-settings'

interface ActiveTemplateShell {
  id: string
  userId: string
  name: string
  isDefault: boolean
  isActive: boolean
  layout: any[]
  createdAt: Date
  updatedAt: Date
}

export interface InitBootstrapPayload {
  isAuthenticated: boolean
  user: any | null
  accounts: any[]
  calendarNotes: Record<string, string>
  activeTemplateShell: ActiveTemplateShell | null
}

export async function getInitBootstrapData(): Promise<InitBootstrapPayload> {
  try {
    const identity = await getResolvedUserIdentitySafe()

    if (!identity) {
      return {
        isAuthenticated: false,
        user: null,
        accounts: [],
        calendarNotes: {},
        activeTemplateShell: null,
      }
    }

    const userLookup = await prisma.user.findUnique({
      where: { id: identity.internalUserId },
      select: {
        id: true,
        email: true,
        auth_user_id: true,
        isFirstConnection: true,
        timezone: true,
        theme: true,
        accentPack: true,
        pnlDisplayMode: true,
        firstName: true,
        lastName: true,
        accountFilterSettings: true,
        backtestInputMode: true,
        breakEvenThreshold: true,
        autoAdjustAccountDate: true,
        aiSettings: true,
        settings: {
          select: USER_SETTINGS_SELECT
        }
      }
    })

    if (!userLookup) {
      return {
        isAuthenticated: false,
        user: null,
        accounts: [],
        calendarNotes: {},
        activeTemplateShell: null,
      }
    }

    const internalUserId = userLookup.id

    const [accounts, calendarNotes, propFirmAccounts, allTrades, activeTemplate] = await Promise.all([
      prisma.account.findMany({
        where: { userId: internalUserId },
        orderBy: { createdAt: 'desc' }
      }),

      (async () => {
        const twoYearsAgo = new Date()
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
        const notes = await prisma.dailyNote.findMany({
          where: { userId: internalUserId, date: { gte: twoYearsAgo } },
          select: { date: true, note: true }
        })
        return notes.reduce<Record<string, string>>((acc, note) => {
          const dateKey = typeof note.date === 'string'
            ? note.date
            : note.date.toISOString().split('T')[0]
          acc[dateKey] = note.note
          return acc
        }, {})
      })(),

      prisma.masterAccount.findMany({
        where: { userId: internalUserId },
        include: { PhaseAccount: { orderBy: { phaseNumber: 'asc' } } }
      }),

      prisma.trade.findMany({
        where: { userId: internalUserId },
        select: TRADE_COUNT_SELECT,
      }),

      prisma.dashboardTemplate.findFirst({
        where: {
          userId: internalUserId,
          isActive: true,
        },
        select: {
          id: true,
          userId: true,
          name: true,
          isDefault: true,
          isActive: true,
          layout: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

    const groupedCounts = buildGroupedTradeCountSummary(allTrades as any)

    const isFundedPhase = (evaluationType: string, phaseNumber: number): boolean => {
      switch (evaluationType) {
        case 'Two Step': return phaseNumber >= 3
        case 'One Step': return phaseNumber >= 2
        case 'Instant': return phaseNumber >= 1
        default: return phaseNumber >= 3
      }
    }

    const getPhaseDisplayName = (evaluationType: string, phaseNumber: number): string => {
      if (isFundedPhase(evaluationType, phaseNumber)) return 'Funded'
      return `Phase ${phaseNumber}`
    }

    const processedLiveAccounts = accounts.map((acc: typeof accounts[number]) => ({
      ...acc,
      propfirm: '',
      tradeCount: groupedCounts.groupedCountByLiveAccountNumber.get(acc.number) || 0,
      accountType: 'live' as const,
      displayName: acc.name || acc.number,
      status: 'active' as const,
      currentPhase: null,
      currentPhaseDetails: null,
      isArchived: acc.isArchived || false,
    }))

    const processedPropFirmAccounts: any[] = []
    propFirmAccounts.forEach((masterAccount: any) => {
      if (masterAccount.PhaseAccount?.length > 0) {
        masterAccount.PhaseAccount.forEach((phase: any) => {
          if (phase.status === 'pending' || phase.status === 'pending_approval') return
          if (!phase.phaseId || phase.phaseId.trim() === '') return

          const phaseName = getPhaseDisplayName(masterAccount.evaluationType, phase.phaseNumber)
          const phaseTradeCount =
            groupedCounts.groupedCountByPhaseAccountId.get(phase.id) ||
            groupedCounts.groupedCountByAccountNumber.get(phase.phaseId) ||
            0

          processedPropFirmAccounts.push({
            id: phase.id,
            number: phase.phaseId,
            name: masterAccount.accountName,
            propfirm: masterAccount.propFirmName,
            broker: undefined,
            startingBalance: phase.accountSize || masterAccount.accountSize,
            accountType: 'prop-firm' as const,
            displayName: `${masterAccount.accountName} (${phaseName})`,
            tradeCount: phaseTradeCount,
            status: phase.status,
            currentPhase: phase.phaseNumber,
            createdAt: phase.createdAt || masterAccount.createdAt,
            userId: masterAccount.userId,
            isArchived: masterAccount.isArchived || false,
            currentPhaseDetails: {
              phaseNumber: phase.phaseNumber,
              status: phase.status,
              phaseId: phase.phaseId,
              masterAccountId: masterAccount.id,
              masterAccountName: masterAccount.accountName,
              evaluationType: masterAccount.evaluationType,
            }
          })
        })
      }
    })

    const activeTemplateShell: ActiveTemplateShell | null = activeTemplate
      ? {
          ...activeTemplate,
          layout: activeTemplate.isDefault
            ? cloneDefaultTemplateLayout()
            : (activeTemplate.layout as any[]),
        }
      : null

    return {
      isAuthenticated: true,
      user: mergeUserSettings(userLookup as any, (userLookup as any).settings),
      accounts: [...processedLiveAccounts, ...processedPropFirmAccounts],
      calendarNotes,
      activeTemplateShell,
    }
  } catch {
    return {
      isAuthenticated: false,
      user: null,
      accounts: [],
      calendarNotes: {},
      activeTemplateShell: null,
    }
  }
}
