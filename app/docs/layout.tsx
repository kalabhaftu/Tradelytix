import { ReactNode } from 'react'

import { PublicHeader } from '@/components/layouts/public-header'

import { DocsLayoutClient } from './docs-layout-client'

export default async function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader
        activeHref="/docs"
        navItems={[
          { href: '/docs', label: 'Docs' },
          { href: '/feedback', label: 'Feedback' },
          { href: '/donate', label: 'Donate' },
        ]}
        containerClassName="max-w-[1600px]"
      />
      <DocsLayoutClient>{children}</DocsLayoutClient>
    </div>
  )
}
