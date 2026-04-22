import { ReactNode } from 'react'

import { PublicShell } from '@/components/layouts/public-shell'

export default async function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <PublicShell
      activeHref=""
      navItems={[
        { href: '/docs', label: 'Docs' },
        { href: '/feedback', label: 'Feedback' },
        { href: '/donate', label: 'Donate' },
      ]}
      headerContainerClassName="max-w-6xl"
      mainClassName="max-w-4xl"
    >
      {children}
    </PublicShell>
  )
}
