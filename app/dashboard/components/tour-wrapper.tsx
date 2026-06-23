'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

const LazyTourProvider = dynamic(
  () => import('@/context/tour-context').then(m => ({ default: m.TourProvider })),
  { ssr: false }
)

export function TourWrapper({ children }: { children: ReactNode }) {
  return <LazyTourProvider>{children}</LazyTourProvider>
}
