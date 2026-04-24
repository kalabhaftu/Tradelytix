import { Prisma } from '@prisma/client'
import type { User, UserSettings } from '@prisma/client'

export const DEFAULT_AI_SETTINGS = {
  autoGenerateInsights: false,
  includeAiInsightsInNotifications: false,
}

export const USER_SETTINGS_SELECT = {
  timezone: true,
  theme: true,
  accountFilterSettings: true,
  aiSettings: true,
  backtestInputMode: true,
  breakEvenThreshold: true,
  pnlDisplayMode: true,
  accentPack: true,
  autoAdjustAccountDate: true,
} satisfies Prisma.UserSettingsSelect

export type UserSettingsShape = Prisma.UserSettingsGetPayload<{
  select: typeof USER_SETTINGS_SELECT
}>

export const USER_SETTINGS_FIELDS = [
  'timezone',
  'theme',
  'accountFilterSettings',
  'aiSettings',
  'backtestInputMode',
  'breakEvenThreshold',
  'pnlDisplayMode',
  'accentPack',
  'autoAdjustAccountDate',
] as const

type SettingsField = (typeof USER_SETTINGS_FIELDS)[number]

export function normalizeAiSettings(value: unknown) {
  const raw = typeof value === 'object' && value ? (value as Record<string, unknown>) : {}
  return {
    autoGenerateInsights: !!raw.autoGenerateInsights,
    includeAiInsightsInNotifications: raw.includeAiInsightsInNotifications !== false
      ? !!raw.includeAiInsightsInNotifications
      : false,
  }
}

export function getDefaultUserSettings(): UserSettingsShape {
  return {
    timezone: 'America/New_York',
    theme: 'system',
    accountFilterSettings: null,
    aiSettings: DEFAULT_AI_SETTINGS,
    backtestInputMode: 'manual',
    breakEvenThreshold: 10,
    pnlDisplayMode: 'net',
    accentPack: 'classic',
    autoAdjustAccountDate: false,
  }
}

export function mergeUserSettings<
  T extends Pick<User, 'timezone' | 'theme' | 'accountFilterSettings' | 'aiSettings' | 'backtestInputMode' | 'breakEvenThreshold' | 'pnlDisplayMode' | 'accentPack' | 'autoAdjustAccountDate'>
>(
  user: T,
  settings?: Partial<UserSettingsShape> | null
) {
  const defaults = getDefaultUserSettings()
  return {
    ...user,
    timezone: settings?.timezone ?? user.timezone ?? defaults.timezone,
    theme: settings?.theme ?? user.theme ?? defaults.theme,
    accountFilterSettings: settings?.accountFilterSettings ?? user.accountFilterSettings ?? defaults.accountFilterSettings,
    aiSettings: normalizeAiSettings(settings?.aiSettings ?? user.aiSettings ?? defaults.aiSettings),
    backtestInputMode: settings?.backtestInputMode ?? user.backtestInputMode ?? defaults.backtestInputMode,
    breakEvenThreshold: settings?.breakEvenThreshold ?? user.breakEvenThreshold ?? defaults.breakEvenThreshold,
    pnlDisplayMode: settings?.pnlDisplayMode ?? user.pnlDisplayMode ?? defaults.pnlDisplayMode,
    accentPack: settings?.accentPack ?? user.accentPack ?? defaults.accentPack,
    autoAdjustAccountDate: settings?.autoAdjustAccountDate ?? user.autoAdjustAccountDate ?? defaults.autoAdjustAccountDate,
  }
}

export function extractUserSettingsData(
  source: Partial<Pick<User, SettingsField>> | Partial<UserSettingsShape> | null | undefined
): UserSettingsShape {
  const defaults = getDefaultUserSettings()
  return {
    timezone: source?.timezone ?? defaults.timezone,
    theme: source?.theme ?? defaults.theme,
    accountFilterSettings: source?.accountFilterSettings ?? defaults.accountFilterSettings,
    aiSettings: normalizeAiSettings(source?.aiSettings ?? defaults.aiSettings),
    backtestInputMode: source?.backtestInputMode ?? defaults.backtestInputMode,
    breakEvenThreshold: source?.breakEvenThreshold ?? defaults.breakEvenThreshold,
    pnlDisplayMode: source?.pnlDisplayMode ?? defaults.pnlDisplayMode,
    accentPack: source?.accentPack ?? defaults.accentPack,
    autoAdjustAccountDate: source?.autoAdjustAccountDate ?? defaults.autoAdjustAccountDate,
  }
}

function toNullableJsonInput(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) {
    return Prisma.JsonNull
  }

  return normalizeAiSettings(value) as Prisma.InputJsonValue
}

export function extractUserSettingsWriteData(
  source: Partial<Pick<User, SettingsField>> | Partial<UserSettingsShape> | null | undefined
) {
  const normalized = extractUserSettingsData(source)

  return {
    timezone: normalized.timezone,
    theme: normalized.theme,
    accountFilterSettings: normalized.accountFilterSettings,
    aiSettings: toNullableJsonInput(normalized.aiSettings),
    backtestInputMode: normalized.backtestInputMode,
    breakEvenThreshold: normalized.breakEvenThreshold,
    pnlDisplayMode: normalized.pnlDisplayMode,
    accentPack: normalized.accentPack,
    autoAdjustAccountDate: normalized.autoAdjustAccountDate,
  }
}

export function buildUserSettingsUpdateData(
  source: Partial<Pick<User, SettingsField>> | Partial<UserSettingsShape>
): Prisma.UserSettingsUpdateInput {
  const update: Prisma.UserSettingsUpdateInput = {}

  if ('timezone' in source && source.timezone !== undefined) update.timezone = source.timezone
  if ('theme' in source && source.theme !== undefined) update.theme = source.theme
  if ('accountFilterSettings' in source && source.accountFilterSettings !== undefined) {
    update.accountFilterSettings = source.accountFilterSettings
  }
  if ('aiSettings' in source && source.aiSettings !== undefined) {
    update.aiSettings = toNullableJsonInput(source.aiSettings)
  }
  if ('backtestInputMode' in source && source.backtestInputMode !== undefined) {
    update.backtestInputMode = source.backtestInputMode
  }
  if ('breakEvenThreshold' in source && source.breakEvenThreshold !== undefined) {
    update.breakEvenThreshold = source.breakEvenThreshold
  }
  if ('pnlDisplayMode' in source && source.pnlDisplayMode !== undefined) {
    update.pnlDisplayMode = source.pnlDisplayMode
  }
  if ('accentPack' in source && source.accentPack !== undefined) {
    update.accentPack = source.accentPack
  }
  if ('autoAdjustAccountDate' in source && source.autoAdjustAccountDate !== undefined) {
    update.autoAdjustAccountDate = source.autoAdjustAccountDate
  }

  return update
}

export function buildSettingsMirrorData(
  currentUser: Pick<User, SettingsField>,
  settingsPatch: Partial<UserSettingsShape>
): Prisma.UserUpdateInput {
  const merged = mergeUserSettings(currentUser as any, settingsPatch)
  return {
    timezone: merged.timezone,
    theme: merged.theme,
    accountFilterSettings: merged.accountFilterSettings,
    aiSettings: normalizeAiSettings(merged.aiSettings),
    backtestInputMode: merged.backtestInputMode,
    breakEvenThreshold: merged.breakEvenThreshold,
    pnlDisplayMode: merged.pnlDisplayMode,
    accentPack: merged.accentPack,
    autoAdjustAccountDate: merged.autoAdjustAccountDate,
  }
}

export function pickSettingsPatch(source: Record<string, unknown>) {
  const patch: Partial<UserSettingsShape> = {}

  for (const field of USER_SETTINGS_FIELDS) {
    if (field in source) {
      ;(patch as any)[field] = source[field]
    }
  }

  if ('aiSettings' in patch) {
    patch.aiSettings = normalizeAiSettings(patch.aiSettings)
  }

  return patch
}

export function settingsCreateFromUser(user: Pick<User, SettingsField>): Prisma.UserSettingsCreateInput {
  return {
    ...extractUserSettingsWriteData(user),
    User: {
      connect: { id: (user as any).id },
    },
  }
}
