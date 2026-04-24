import { prisma } from '@/lib/prisma'
import { mergeUserSettings, USER_SETTINGS_SELECT } from '@/lib/user-settings'
import { getBreakEvenThreshold } from '@/lib/metrics/outcome'
import { normalizePnlDisplayMode } from '@/lib/metrics/pnl'

const USER_SETTINGS_MIRROR_SELECT = {
  timezone: true,
  theme: true,
  accountFilterSettings: true,
  aiSettings: true,
  backtestInputMode: true,
  breakEvenThreshold: true,
  pnlDisplayMode: true,
  accentPack: true,
  autoAdjustAccountDate: true,
} as const

export async function getMergedRuntimeUserSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...USER_SETTINGS_MIRROR_SELECT,
      settings: {
        select: USER_SETTINGS_SELECT,
      },
    },
  })

  if (!user) {
    return null
  }

  return mergeUserSettings(user as any, (user as any).settings)
}

export async function getRuntimeBreakEvenThreshold(userId: string) {
  const settings = await getMergedRuntimeUserSettings(userId)
  return getBreakEvenThreshold(settings?.breakEvenThreshold)
}

export async function getRuntimePnlDisplayMode(userId: string) {
  const settings = await getMergedRuntimeUserSettings(userId)
  return normalizePnlDisplayMode(settings?.pnlDisplayMode)
}

export async function getRuntimeAutoAdjustAccountDate(userId: string) {
  const settings = await getMergedRuntimeUserSettings(userId)
  return !!settings?.autoAdjustAccountDate
}

