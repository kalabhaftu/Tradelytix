import { ReactNode } from 'react'

import { PublicShell } from '@/components/layouts/public-shell'
import { filterSupportNavItems, getSiteUiSettings } from '@/server/site-ui-settings'

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const siteUiSettings = await getSiteUiSettings()

  return (
    <PublicShell
      activeHref=""
      navItems={filterSupportNavItems([
        { href: '/docs', label: 'Docs' },
        { href: '/feedback', label: 'Feedback' },
        { href: '/donate', label: 'Donate' },
      ], siteUiSettings)}
      headerContainerClassName="max-w-6xl"
      mainClassName="max-w-4xl"
    >
      {children}
    </PublicShell>
  )
}
