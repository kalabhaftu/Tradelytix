'use client'

import { useEffect } from 'react'
import { applyConsoleFilter } from '@/lib/console-filter'
import { applyConsoleInterceptor } from '@/lib/console-interceptor'

interface ConsoleFilterWrapperProps {
  children: React.ReactNode
}

/**
 * Client component that applies console filtering in development
 * and console interception in production
 */
export function ConsoleFilterWrapper({ children }: ConsoleFilterWrapperProps) {
  useEffect(() => {
    // Apply console filtering only in development
    if (process.env.NODE_ENV === 'development') {
      applyConsoleFilter()
    }
    
    // Apply console interception only in production
    if (process.env.NODE_ENV === 'production') {
      applyConsoleInterceptor()
    }
  }, [])

  return <>{children}</>
}
