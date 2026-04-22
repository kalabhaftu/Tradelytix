import { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { PublicHeader } from './public-header'

interface PublicShellProps {
  children: ReactNode
  navItems?: Array<{ href: string; label: string }>
  activeHref?: string
  headerContainerClassName?: string
  mainClassName?: string
}

export async function PublicShell({
  children,
  navItems,
  activeHref,
  headerContainerClassName,
  mainClassName,
}: PublicShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader
        navItems={navItems}
        activeHref={activeHref}
        containerClassName={headerContainerClassName}
      />
      <main className={cn('mx-auto w-full px-4 py-8 sm:px-6', mainClassName)}>{children}</main>
    </div>
  )
}
