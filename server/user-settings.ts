import { prisma } from '@/lib/prisma'
import { getDefaultUserSettings, USER_SETTINGS_SELECT } from '@/lib/user-settings'
import { getBreakEvenThreshold } from '@/lib/metrics/outcome'
import { normalizePnlDisplayMode } from '@/lib/metrics/pnl'

export async function getMergedRuntimeUserSettings(userId: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: USER_SETTINGS_SELECT,
  })

  if (!settings) {
    return null
  }

  return settings
}

export async function getRuntimeBreakEvenThreshold(userId: string) {
  const settings = await getMergedRuntimeUserSettings(userId) ?? getDefaultUserSettings()
  return getBreakEvenThreshold(settings.breakEvenThreshold)
}

export async function getRuntimePnlDisplayMode(userId: string) {
  const settings = await getMergedRuntimeUserSettings(userId) ?? getDefaultUserSettings()
  return normalizePnlDisplayMode(settings.pnlDisplayMode)
}

export async function getRuntimeAutoAdjustAccountDate(userId: string) {
  const settings = await getMergedRuntimeUserSettings(userId) ?? getDefaultUserSettings()
  return !!settings.autoAdjustAccountDate
}
