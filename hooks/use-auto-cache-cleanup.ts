/**
 * Automatic Cache Cleanup Hook
 * 
 * This hook automatically detects and clears stale caches when:
 * - App loads and cache version doesn't match
 * - Accounts are created, updated, or deleted
 * - User logs in/out
 * - Critical data changes occur
 */

import { useEffect, useRef } from 'react'
import { autoCleanStaleCache, clearAccountCaches, getCacheStats } from '@/lib/cache/persistent-cache'
import { invalidateAccountsCache } from './use-accounts'

interface UseAutoCacheCleanupOptions {
  userId?: string
  enabled?: boolean
}

export function useAutoCacheCleanup(options: UseAutoCacheCleanupOptions = {}) {
  const { userId, enabled = true } = options
  const hasRunRef = useRef(false)
  const lastUserIdRef = useRef<string | undefined>(undefined)
  
  useEffect(() => {
    if (!enabled) return
    
    // Run once on mount to check for stale caches
    if (!hasRunRef.current) {
      hasRunRef.current = true
      
      ;(async () => {
        try {
          const wasCleared = await autoCleanStaleCache()
          
          if (wasCleared) {
            invalidateAccountsCache('auto-cleanup on version mismatch')
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      })()
    }
    
    if (userId && lastUserIdRef.current && userId !== lastUserIdRef.current) {
      clearAccountCaches()
      invalidateAccountsCache('user changed')
    }
    
    lastUserIdRef.current = userId
  }, [userId, enabled])
  
  return {
    manualCleanup: async () => {
      await autoCleanStaleCache()
      clearAccountCaches()
      invalidateAccountsCache('manual cleanup')
    }
  }
}

/**
 * Hook to automatically clear caches when accounts change
 */
export function useAccountChangeDetection() {
  const accountsVersionRef = useRef<number>(0)
  
  return {
    notifyAccountsChanged: () => {
      accountsVersionRef.current++
      clearAccountCaches()
      invalidateAccountsCache('accounts changed')
    }
  }
}

