'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/store/user-store'
import { toast } from 'sonner'

export type TourId = 'onboarding' | 'dashboard' | 'analytics' | 'settings'

export interface TourStep {
  id: string
  title: string
  content: string
  targetSelector?: string // If null, renders as centered modal overlay
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  route?: string // Route the user must be on for this step
  actionType?: 'click' | 'input' | 'none' // User action to unlock Next
  actionTarget?: string // Selector that user must interact with
  contrastMessage?: string // Optional contrast explanation ("Why you aren't here")
  desktopOnly?: boolean // Skip this step on mobile
  icon?: string // Optional icon identifier
}

interface OnboardingStatus {
  core_onboarding_completed: boolean
  dashboard_tour_completed: boolean
  analytics_tour_completed: boolean
  settings_tour_completed: boolean
  last_updated?: string
}

interface TourContextType {
  activeTour: TourId | null
  stepIndex: number
  currentStep: TourStep | null
  paused: boolean
  onboardingStatus: OnboardingStatus | null
  startTour: (tourId: TourId) => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
  resumeTour: () => void
  pauseTour: () => void
  isTargetVisible: boolean
  isLoadingTarget: boolean
}

const TourContext = createContext<TourContextType | undefined>(undefined)

const DEFAULT_ONBOARDING_STATUS: OnboardingStatus = {
  core_onboarding_completed: false,
  dashboard_tour_completed: false,
  analytics_tour_completed: false,
  settings_tour_completed: false,
}

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const pathname = usePathname()
  const storeUser = useUserStore((state) => state.user)
  const setDbUser = useUserStore((state) => state.setUser)
  const isMobile = useUserStore((state) => state.isMobile)

  const [activeTour, setActiveTour] = useState<TourId | null>(null)
  const [stepIndex, setStepIndex] = useState<number>(0)
  const [paused, setPaused] = useState<boolean>(false)
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
  const [isTargetVisible, setIsTargetVisible] = useState<boolean>(false)
  const [isLoadingTarget, setIsLoadingTarget] = useState<boolean>(false)

  const targetCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const targetTimeout = useRef<NodeJS.Timeout | null>(null)

  // Define Steps for each Tour
  const tours: Record<TourId, TourStep[]> = {
    onboarding: [
      {
        id: 'welcome',
        title: 'Welcome to Tradelytix! 🚀',
        content: 'Your advanced trading analytics platform. Let\'s take a quick 2-minute tour to help you set up and get familiar with the core layout.',
        placement: 'center',
        route: '/dashboard',
        actionType: 'none',
      },
      {
        id: 'settings-contrast',
        title: 'Settings (Why You Aren\'t Here) ⚙️',
        content: 'Let\'s go to Settings first to see where configurations live. Notice that timezone settings, themes, and Webhook tokens are configured here, completely separated from your main trading view.',
        targetSelector: '[data-tour="settings-card-profile"]',
        placement: 'bottom',
        route: '/dashboard/settings',
        actionType: 'none',
        contrastMessage: 'Why you aren\'t here: Configurations belong in Settings. We keep execution data and performance tracking separate on the dashboard to ensure a clean, distraction-free environment.',
      },
      {
        id: 'theme-interaction',
        title: 'Interact: Try theme toggling 🎨',
        content: 'Click the Theme selector options below to see how responsive the platform styling is. Once clicked, the next step will unlock.',
        targetSelector: '[data-tour="theme-switcher-container"]',
        placement: 'bottom',
        route: '/dashboard/settings',
        actionType: 'click',
        actionTarget: '[data-tour="theme-switcher-container"]',
      },
      {
        id: 'back-to-dashboard',
        title: 'Navigating Back 🧭',
        content: 'Great job! Now let\'s navigate back to the Main Overview page. Click the "Got it" button below, and we will take you right back.',
        targetSelector: '[data-tour="sidebar-widgets"]',
        placement: 'right',
        route: '/dashboard/settings',
        actionType: 'none',
      },
      {
        id: 'dashboard-quick-add',
        title: 'Lightweight Logging ➕',
        content: 'Look at the "+" button in the navigation header (or the floating button on mobile). This is your primary way to manually record new journal logs. Click it to open the Quick Add panel.',
        targetSelector: '[data-tour="quick-add-btn"]',
        placement: 'bottom',
        route: '/dashboard',
        actionType: 'click',
        actionTarget: '[data-tour="quick-add-btn"]',
      },
      {
        id: 'manual-ticker',
        title: 'Enter Mock Ticker ✍️',
        content: 'Excellent! The dialog is open. Type "EURUSD" or any ticker symbol in the Instrument field to see the live form validation in action. The tour will proceed once you enter text.',
        targetSelector: '#instrument',
        placement: 'bottom',
        route: '/dashboard',
        actionType: 'input',
        actionTarget: '#instrument',
      },
      {
        id: 'onboarding-completed',
        title: 'Tour Complete! 🎉',
        content: 'You\'ve mastered the core navigation and interactions! You can close the modal now. Click "Got it" to finish your onboarding.',
        placement: 'center',
        route: '/dashboard',
        actionType: 'none',
      },
    ],
    dashboard: [
      {
        id: 'db-welcome',
        title: 'Trading Dashboard 📊',
        content: 'This is your central command. You can track performance metrics, inspect charts, and view recent activity at a glance.',
        placement: 'center',
        route: '/dashboard',
      },
      {
        id: 'db-accounts',
        title: 'Multi-Portfolio Accounts 💼',
        content: 'Click here to filter the dashboard by specific portfolios. You can select one or multiple accounts (live or prop-firm evaluation phases) simultaneously.',
        targetSelector: '[data-tour="navbar-accounts-btn"]',
        placement: 'bottom',
        route: '/dashboard',
      },
      {
        id: 'db-canvas',
        title: 'Dynamic Widget Canvas 🧩',
        content: 'Your dashboard widgets are fully customizable. Click "Got it" to wrap up the dashboard tour.',
        targetSelector: '[data-tour="widget-canvas"]',
        placement: 'top',
        route: '/dashboard',
      },
    ],
    analytics: [
      {
        id: 'analytics-welcome',
        title: 'Performance Reports 📈',
        content: 'Dive deep into win rate distribution, average holding times, cumulative PnL, and advanced metrics.',
        placement: 'center',
        route: '/dashboard/reports',
      },
    ],
    settings: [
      {
        id: 'settings-welcome',
        title: 'Account Settings ⚙️',
        content: 'Configure personal details, timezone adjustments, dashboard layout resets, and premium subscription details.',
        placement: 'center',
        route: '/dashboard/settings',
      },
    ],
  }

  const currentSteps = activeTour ? tours[activeTour] : []
  const currentStep = activeTour && currentSteps[stepIndex] ? currentSteps[stepIndex] : null

  // Fetch onboarding status from Zustand store / User data
  useEffect(() => {
    if (storeUser) {
      const dbStatus = (storeUser as any).onboardingStatus
      if (dbStatus && typeof dbStatus === 'object') {
        setOnboardingStatus({
          core_onboarding_completed: !!dbStatus.core_onboarding_completed,
          dashboard_tour_completed: !!dbStatus.dashboard_tour_completed,
          analytics_tour_completed: !!dbStatus.analytics_tour_completed,
          settings_tour_completed: !!dbStatus.settings_tour_completed,
          last_updated: dbStatus.last_updated,
        })
      } else {
        setOnboardingStatus(DEFAULT_ONBOARDING_STATUS)
      }
    }
  }, [storeUser])

  // Automatically trigger onboarding for new users on main dashboard page
  useEffect(() => {
    if (
      onboardingStatus &&
      onboardingStatus.core_onboarding_completed === false &&
      activeTour === null &&
      pathname === '/dashboard' &&
      !paused
    ) {
      // Small timeout to let initial page fully render
      const timer = setTimeout(() => {
        startTour('onboarding')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [onboardingStatus, activeTour, pathname, paused])

  // Save onboarding status to DB
  const saveOnboardingStatus = async (updatedStatus: Partial<OnboardingStatus>) => {
    if (!storeUser) return

    const nextStatus = {
      ...onboardingStatus,
      ...updatedStatus,
      last_updated: new Date().toISOString(),
    }

    setOnboardingStatus(nextStatus as OnboardingStatus)

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingStatus: nextStatus }),
      })
      const result = await response.json()
      if (result.success && result.data) {
        setDbUser(result.data)
      }
    } catch (error) {
      console.error('Failed to save onboarding status:', error)
    }
  }

  // Handle route and target visibility checks for the active step
  useEffect(() => {
    if (!activeTour || !currentStep || paused) {
      setIsTargetVisible(false)
      setIsLoadingTarget(false)
      return
    }

    // Check if we need to route to a different page
    if (currentStep.route && pathname !== currentStep.route) {
      setIsLoadingTarget(true)
      router.push(currentStep.route)
      return
    }

    // Check if the step is desktop-only and we are on mobile
    if (currentStep.desktopOnly && isMobile) {
      // Skip this step automatically
      nextStep()
      return
    }

    // If step has no target selector, it's a modal
    if (!currentStep.targetSelector) {
      setIsTargetVisible(true)
      setIsLoadingTarget(false)
      return
    }

    setIsTargetVisible(false)
    setIsLoadingTarget(true)

    // Clear previous check timers
    if (targetCheckInterval.current) clearInterval(targetCheckInterval.current)
    if (targetTimeout.current) clearTimeout(targetTimeout.current)

    // Poll for the target element to handle rendering delays / network loading
    let attempts = 0
    targetCheckInterval.current = setInterval(() => {
      const el = document.querySelector(currentStep.targetSelector!)
      attempts++

      if (el) {
        setIsTargetVisible(true)
        setIsLoadingTarget(false)
        clearInterval(targetCheckInterval.current!)
        targetCheckInterval.current = null
      } else if (attempts >= 15) {
        // Pauses gracefully if target element doesn't appear after 7.5 seconds (network delay or user clicked away)
        clearInterval(targetCheckInterval.current!)
        targetCheckInterval.current = null
        setIsLoadingTarget(false)
        pauseTour()
        toast.info('Tour paused. Click the resume widget to continue when ready.', { duration: 4000 })
      }
    }, 500)

    return () => {
      if (targetCheckInterval.current) clearInterval(targetCheckInterval.current)
    }
  }, [activeTour, stepIndex, pathname, paused, isMobile])

  // Setup interactive listeners if step requires real user interaction
  useEffect(() => {
    if (!activeTour || !currentStep || paused || !isTargetVisible) return

    const { actionType, actionTarget } = currentStep
    if (!actionType || !actionTarget) return

    const handleAction = () => {
      // Interaction performed, unlock and go to next step
      setTimeout(() => {
        nextStep()
      }, 300)
    }

    const setupListeners = () => {
      const elements = document.querySelectorAll(actionTarget)
      if (elements.length === 0) return false

      if (actionType === 'click') {
        elements.forEach((el) => el.addEventListener('click', handleAction))
      } else if (actionType === 'input') {
        elements.forEach((el) => el.addEventListener('input', handleAction, { once: true }))
      }
      return true
    }

    // Try immediately
    let bound = setupListeners()

    // If elements not fully loaded or dynamic, poll brief time to attach
    let attachTimer: NodeJS.Timeout | null = null
    if (!bound) {
      let attempts = 0
      attachTimer = setInterval(() => {
        bound = setupListeners()
        attempts++
        if (bound || attempts > 10) {
          clearInterval(attachTimer!)
        }
      }, 300)
    }

    return () => {
      if (attachTimer) clearInterval(attachTimer)
      const elements = document.querySelectorAll(actionTarget)
      elements.forEach((el) => {
        el.removeEventListener('click', handleAction)
        el.removeEventListener('input', handleAction)
      })
    }
  }, [activeTour, stepIndex, isTargetVisible, paused])

  // Action methods
  const startTour = (tourId: TourId) => {
    setActiveTour(tourId)
    setStepIndex(0)
    setPaused(false)
  }

  const nextStep = () => {
    if (!activeTour) return

    // If current step is back-to-dashboard and we are in onboarding, navigate back
    if (activeTour === 'onboarding' && stepIndex === 3) {
      router.push('/dashboard')
    }

    if (stepIndex < currentSteps.length - 1) {
      setStepIndex((prev) => prev + 1)
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1)
    }
  }

  const skipTour = () => {
    if (!activeTour) return

    const keyMap: Record<TourId, keyof OnboardingStatus> = {
      onboarding: 'core_onboarding_completed',
      dashboard: 'dashboard_tour_completed',
      analytics: 'analytics_tour_completed',
      settings: 'settings_tour_completed',
    }

    saveOnboardingStatus({ [keyMap[activeTour]]: true })
    setActiveTour(null)
    setPaused(false)
    toast.success('Tour skipped. You can restart it anytime from settings.')
  }

  const completeTour = () => {
    if (!activeTour) return

    const keyMap: Record<TourId, keyof OnboardingStatus> = {
      onboarding: 'core_onboarding_completed',
      dashboard: 'dashboard_tour_completed',
      analytics: 'analytics_tour_completed',
      settings: 'settings_tour_completed',
    }

    saveOnboardingStatus({ [keyMap[activeTour]]: true })
    setActiveTour(null)
    setPaused(false)
    toast.success('Congratulations! Tour completed. 🎉')
  }

  const pauseTour = () => {
    setPaused(true)
  }

  const resumeTour = () => {
    setPaused(false)
    // If the step we paused on has a specific route, force route check
    if (currentStep?.route && pathname !== currentStep.route) {
      router.push(currentStep.route)
    }
  }

  return (
    <TourContext.Provider
      value={{
        activeTour,
        stepIndex,
        currentStep,
        paused,
        onboardingStatus,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        completeTour,
        resumeTour,
        pauseTour,
        isTargetVisible,
        isLoadingTarget,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

export const useTour = () => {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
