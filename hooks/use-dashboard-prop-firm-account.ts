"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'dashboard.propFirmWidgets.selectedMasterAccountId'

type PhaseSummary = {
  id: string
  phaseNumber: number
  phaseId?: string | null
  status?: string | null
}

export type DashboardPropFirmAccountOption = {
  id: string
  accountName: string
  propFirmName: string
  accountSize: number
  evaluationType: string
  status: string
  currentPhase?: number | null
  PhaseAccount?: PhaseSummary[]
}

function getStoredSelection() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

function setStoredSelection(value: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, value)
  window.dispatchEvent(new CustomEvent('prop-firm-widget-account-change', { detail: value }))
}

function getPreferredAccount(accounts: DashboardPropFirmAccountOption[]) {
  return accounts.find((account) => ['active', 'funded'].includes(String(account.status).toLowerCase())) ?? accounts[0] ?? null
}

export function useDashboardPropFirmAccount() {
  const [accounts, setAccounts] = useState<DashboardPropFirmAccountOption[]>([])
  const [selectedMasterAccountId, setSelectedMasterAccountIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAccounts() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/v1/prop-firm/accounts')
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load prop firm accounts')
        }

        const nextAccounts = Array.isArray(payload.data) ? payload.data : []
        if (cancelled) return

        setAccounts(nextAccounts)
        const stored = getStoredSelection()
        const storedExists = stored && nextAccounts.some((account: DashboardPropFirmAccountOption) => account.id === stored)
        const preferred = storedExists ? stored : getPreferredAccount(nextAccounts)?.id ?? null
        setSelectedMasterAccountIdState(preferred)
        if (preferred && preferred !== stored) setStoredSelection(preferred)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load prop firm accounts')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadAccounts()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setSelectedMasterAccountIdState(event.newValue)
    }
    const handleCustom = (event: Event) => {
      setSelectedMasterAccountIdState((event as CustomEvent<string>).detail)
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('prop-firm-widget-account-change', handleCustom)

    return () => {
      cancelled = true
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('prop-firm-widget-account-change', handleCustom)
    }
  }, [])

  const setSelectedMasterAccountId = useCallback((value: string) => {
    setSelectedMasterAccountIdState(value)
    setStoredSelection(value)
  }, [])

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedMasterAccountId) ?? null,
    [accounts, selectedMasterAccountId]
  )

  return {
    accounts,
    selectedAccount,
    selectedMasterAccountId,
    setSelectedMasterAccountId,
    isLoading,
    error,
  }
}
