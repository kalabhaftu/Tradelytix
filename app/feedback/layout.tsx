import { ReactNode } from 'react'

import { PublicShell } from '@/components/layouts/public-shell'
import { filterSupportNavItems, getSiteUiSettings } from '@/server/site-ui-settings'

export default async function FeedbackLayout({ children }: { children: ReactNode }) {
  const siteUiSettings = await getSiteUiSettings()

  return (
    <PublicShell
      activeHref="/feedback"
      navItems={filterSupportNavItems([
        { href: '/docs', label: 'Docs' },
        { href: '/donate', label: 'Donate' },
      ], siteUiSettings)}
      headerContainerClassName="max-w-6xl"
      mainClassName="max-w-4xl"
    >
      {children}
    </PublicShell>
  )
}
