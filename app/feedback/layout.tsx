import { ReactNode } from 'react'

import { PublicShell } from '@/components/layouts/public-shell'

export default async function FeedbackLayout({ children }: { children: ReactNode }) {
  return (
    <PublicShell
      activeHref="/feedback"
      navItems={[
        { href: '/docs', label: 'Docs' },
        { href: '/donate', label: 'Donate' },
      ]}
      headerContainerClassName="max-w-6xl"
      mainClassName="max-w-4xl"
    >
      {children}
    </PublicShell>
  )
}
