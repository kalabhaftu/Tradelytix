import { db } from '@/lib/db/client'
import { getDefaultUserSettings, USER_SETTINGS_SELECT } from '@/lib/user-settings'
import { getBreakEvenThreshold } from '@/lib/metrics/outcome'
import { normalizePnlDisplayMode } from '@/lib/metrics/pnl'

async function getMergedRuntimeUserSettings(userId: string) {
  const settings = await db.query.UserSettings.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
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