'use client'

import { useEffect } from 'react'

const CLEANUP_KEY = 'sw_cleanup_v20260326'

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if (localStorage.getItem(CLEANUP_KEY) === 'done') return
    } catch {
      return
    }

    const runCleanup = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(registrations.map((registration) => registration.unregister()))
        }

        if ('caches' in window) {
          const cacheNames = await caches.keys()
          const staleCaches = cacheNames.filter((name) =>
            /deltalytix/i.test(name) || /next-data/i.test(name)
          )

          await Promise.all(staleCaches.map((name) => caches.delete(name)))
        }

        localStorage.setItem(CLEANUP_KEY, 'done')
      } catch {
        // Keep app resilient even if cleanup fails
      }
    }

    runCleanup()
  }, [])

  return null
}
