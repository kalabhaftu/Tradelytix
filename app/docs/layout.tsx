import { ReactNode } from 'react'

import { PublicHeader } from '@/components/layouts/public-header'
import { filterSupportNavItems, getSiteUiSettings } from '@/server/site-ui-settings'

import { DocsLayoutClient } from './docs-layout-client'

export default async function DocsLayout({ children }: { children: ReactNode }) {
  const siteUiSettings = await getSiteUiSettings()

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader
        activeHref="/docs"
        navItems={filterSupportNavItems([
          { href: '/docs', label: 'Docs' },
          { href: '/feedback', label: 'Feedback' },
        ], siteUiSettings)}
        containerClassName="max-w-[1600px]"
      />
      <DocsLayoutClient>{children}</DocsLayoutClient>
    </div>
  )
}
