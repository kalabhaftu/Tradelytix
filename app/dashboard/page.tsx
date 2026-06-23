'use client'

import NextDynamic from 'next/dynamic'
import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// Import components normally
import { DashboardErrorBoundary, ErrorBoundaryWrapper } from '@/components/error-boundary'

// Dynamically import heavy components for better performance
const WidgetCanvas = NextDynamic(() => import('./components/widget-grid'), {
  ssr: false
})

const EditModeControls = NextDynamic(() => import('./components/edit-mode-controls'), {
  ssr: false
})

// Accounts, Journal, Backtesting, and Table are now standalone routes
// Sidebar moved to layout.tsx - it now wraps all dashboard routes

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Redirect old ?tab= URLs to new standalone routes (backwards compatibility)
  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab) {
      const routes: Record<string, string> = {
        'table': '/dashboard/table',
        'accounts': '/dashboard/accounts',
        'journal': '/dashboard/journal',
        'backtesting': '/dashboard/backtesting'
      }
      if (routes[tab]) {
        router.push(routes[tab])
      }
    }
  }, [searchParams, router])

  useEffect(() => {
    const updateNavbarHeight = () => {
      // The navbar is now sticky (not fixed), query by sticky class
      const navbar = document.querySelector('nav.sticky') as HTMLElement
      if (navbar) {
        const height = navbar.offsetHeight
        document.documentElement.style.setProperty('--navbar-height', `${height}px`)
      }
    }

    // Skip ResizeObserver and event listeners on mobile/tablet screens to prevent layout thrashing
    const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 1024
    if (isMobileScreen) {
      document.documentElement.style.setProperty('--navbar-height', '48px')
      return
    }

    // Initial calculation
    updateNavbarHeight()

    // Use ResizeObserver for navbar height changes
    const navbar = document.querySelector('nav.sticky')
    let resizeObserver: ResizeObserver | null = null

    if (navbar) {
      resizeObserver = new ResizeObserver(() => {
        // Wrap in requestAnimationFrame to avoid "ResizeObserver loop limit exceeded"
        requestAnimationFrame(updateNavbarHeight)
      })
      resizeObserver.observe(navbar)
    }

    // Fallback window resize listener
    window.addEventListener('resize', updateNavbarHeight)

    return () => {
      window.removeEventListener('resize', updateNavbarHeight)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [])

  return (
    <DashboardErrorBoundary>
      <div className="flex flex-1 flex-col w-full">
        {/* Edit Mode Controls */}
        <EditModeControls />
        <ErrorBoundaryWrapper context="Widgets">
          <div className="px-4 dashboard-page-content">
            <WidgetCanvas />
          </div>
        </ErrorBoundaryWrapper>
      </div>
    </DashboardErrorBoundary>
  )
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}