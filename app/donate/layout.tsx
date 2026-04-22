import { ReactNode } from 'react'

import { PublicShell } from '@/components/layouts/public-shell'

export default async function DonateLayout({ children }: { children: ReactNode }) {
  return (
    <PublicShell
      activeHref="/donate"
      navItems={[
        { href: '/docs', label: 'Docs' },
        { href: '/feedback', label: 'Feedback' },
      ]}
      headerContainerClassName="max-w-6xl"
      mainClassName="max-w-5xl"
    >
      {children}
    </PublicShell>
  )
}
