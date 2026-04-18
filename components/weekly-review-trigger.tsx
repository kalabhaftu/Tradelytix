'use client'

import { useEffect, useRef } from 'react'

/**
 * Invisible component that triggers weekly AI review generation.
 * Runs once per session on weekends/Mondays. No UI render.
 *
 * Flow:
 * 1. Check sessionStorage to avoid re-triggering
 * 2. Check if today is Saturday, Sunday, or Monday
 * 3. Check if user has autoGenerateInsights enabled
 * 4. Call POST /api/v1/weekly-review (idempotent — won't duplicate)
 */
export function WeeklyReviewTrigger() {
  const checkedRef = useRef(false)

  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true

    const sessionKey = 'deltalytix_weekly_review_checked'
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(sessionKey)) return

    // Only trigger on Saturday(6), Sunday(0), Monday(1)
    const dayOfWeek = new Date().getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 1 && dayOfWeek !== 6) return

    // Set flag immediately to prevent duplicate calls
    sessionStorage.setItem(sessionKey, '1')

    const triggerReview = async () => {
      try {
        // Check if user has enabled weekly reviews
        const profileRes = await fetch('/api/auth/profile')
        const profileData = await profileRes.json()
        if (!profileData.success) return

        const aiSettings = profileData.data?.aiSettings
        if (!aiSettings?.autoGenerateInsights) return

        // Generate weekly review (idempotent)
        await fetch('/api/v1/weekly-review', { method: 'POST' })
      } catch {
        // Non-critical — silent failure
      }
    }

    // Delay slightly to not compete with initial page load
    const timer = setTimeout(triggerReview, 3000)
    return () => clearTimeout(timer)
  }, [])

  return null
}
