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
    if (process.env.NODE_ENV === 'development') {
      applyConsoleFilter()
    }
    
    if (process.env.NODE_ENV === 'production') {
      applyConsoleInterceptor()
    }
  }, [])

  return <>{children}</>
}
