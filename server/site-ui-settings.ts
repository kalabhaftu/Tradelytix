import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export interface SiteUiSettingsPayload {
  showDonateButton: boolean
  showFeedbackButton: boolean
}

const SITE_UI_SETTINGS_ID = 'global'
const SITE_UI_SETTINGS_CACHE_TAG = 'site-ui-settings'

async function loadSiteUiSettings(): Promise<SiteUiSettingsPayload> {
  const settings = await prisma.siteUiSettings.upsert({
    where: { id: SITE_UI_SETTINGS_ID },
    update: {},
    create: {
      id: SITE_UI_SETTINGS_ID,
      showDonateButton: true,
      showFeedbackButton: true,
    },
  })

  return {
    showDonateButton: settings.showDonateButton,
    showFeedbackButton: settings.showFeedbackButton,
  }
}

const getCachedSiteUiSettings = unstable_cache(
  loadSiteUiSettings,
  [SITE_UI_SETTINGS_CACHE_TAG],
  { tags: [SITE_UI_SETTINGS_CACHE_TAG] }
)

export async function getSiteUiSettings(): Promise<SiteUiSettingsPayload> {
  return getCachedSiteUiSettings()
}

export async function updateSiteUiSettings(
  updates: Partial<SiteUiSettingsPayload>
): Promise<SiteUiSettingsPayload> {
  const settings = await prisma.siteUiSettings.upsert({
    where: { id: SITE_UI_SETTINGS_ID },
    update: {
      ...(updates.showDonateButton !== undefined && {
        showDonateButton: updates.showDonateButton,
      }),
      ...(updates.showFeedbackButton !== undefined && {
        showFeedbackButton: updates.showFeedbackButton,
      }),
    },
    create: {
      id: SITE_UI_SETTINGS_ID,
      showDonateButton: updates.showDonateButton ?? true,
      showFeedbackButton: updates.showFeedbackButton ?? true,
    },
  })

  revalidateTag(SITE_UI_SETTINGS_CACHE_TAG, 'max')
  revalidatePath('/', 'layout')
  revalidatePath('/docs', 'layout')
  revalidatePath('/dashboard', 'layout')
  revalidatePath('/feedback', 'layout')
  revalidatePath('/donate', 'layout')

  return {
    showDonateButton: settings.showDonateButton,
    showFeedbackButton: settings.showFeedbackButton,
  }
}

export function filterSupportNavItems<T extends { href: string }>(
  items: T[],
  settings: SiteUiSettingsPayload
) {
  return items.filter((item) => {
    if (item.href === '/donate') return settings.showDonateButton
    if (item.href === '/feedback') return settings.showFeedbackButton
    return true
  })
}
