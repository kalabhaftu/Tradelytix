'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useUserStore } from '@/store/user-store'
import LoadingOverlay from '../app/dashboard/components/loading-overlay'
import ImportButton from '../app/dashboard/components/import/import-button'
import OnboardingModal from './onboarding-modal'
import { useData } from '@/context/data-provider'


export default function Modals() {
  const user = useUserStore((state) => state.user)
  const isLoading = useUserStore((state) => state.isLoading)
  const { formattedTrades } = useData()
  const [isTradesDialogOpen, setIsTradesDialogOpen] = useState(false)
  const [showLoadingToast, setShowLoadingToast] = useState(false)

  // Debounce loading state to prevent flickering
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined

    if (isLoading) {
      // Show loading toast after 500ms delay to avoid flickering on quick operations
      timeoutId = setTimeout(() => {
        setShowLoadingToast(true)
      }, 500)
    } else {
      // Hide loading toast immediately when loading stops
      setShowLoadingToast(false)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isLoading])

  useEffect(() => {
    if (!isLoading) {
      if (formattedTrades.length === 0) {
        setIsTradesDialogOpen(true)
      }
    }
  }, [formattedTrades.length, isLoading])



  if (!user) return null
  return (
    <>
      {showLoadingToast && <LoadingOverlay />}
      <OnboardingModal />

      {!user?.isFirstConnection && (
        <Dialog open={isTradesDialogOpen} onOpenChange={setIsTradesDialogOpen}>
          <DialogContent>
            <DialogHeader>
            <DialogTitle>No Trades Found</DialogTitle>
            <DialogDescription>
              No trading data available. Import your trades to start analyzing your performance.
            </DialogDescription>
          </DialogHeader>
          <ImportButton />
        </DialogContent>
      </Dialog>
      )}


    </>
  )
}
