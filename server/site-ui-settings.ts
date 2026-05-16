import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export interface SiteUiSettingsPayload {
  showDonateButton: boolean
  showFeedbackButton: boolean
}

const SITE_UI_SETTINGS_ID = 'global'

export async function getSiteUiSettings(): Promise<SiteUiSettingsPayload> {
  const existing = await prisma.siteUiSettings.findUnique({
    where: { id: SITE_UI_SETTINGS_ID },
  })

  const settings = existing
    ?? await prisma.siteUiSettings.create({
      data: {
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
