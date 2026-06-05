'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useUserStore } from '@/store/user-store'

type Theme = 'light' | 'dark' | 'system'
type AccentPack = 'classic' | 'reports' | 'violet'
type WidgetSurfaceStyle = 'default' | 'glass'
type ChartStyle = 'smooth' | 'sharp'

type ThemeContextType = {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  accentPack: AccentPack
  widgetStyle: WidgetSurfaceStyle
  chartStyle: ChartStyle
  setTheme: (theme: Theme) => void
  setAccentPack: (pack: AccentPack) => void
  setWidgetStyle: (style: WidgetSurfaceStyle) => void
  setChartStyle: (style: ChartStyle) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  effectiveTheme: 'dark',
  accentPack: 'classic',
  widgetStyle: 'default',
  chartStyle: 'smooth',
  setTheme: () => {},
  setAccentPack: () => {},
  setWidgetStyle: () => {},
  setChartStyle: () => {},
  toggleTheme: () => {},
})

export const useTheme = () => useContext(ThemeContext)

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyAccentClass(pack: AccentPack) {
  if (typeof window === 'undefined') return
  const root = window.document.documentElement
  root.classList.remove('accent-reports', 'accent-violet')
  if (pack === 'reports') {
    root.classList.add('accent-reports')
  } else if (pack === 'violet') {
    root.classList.add('accent-violet')
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [accentPack, setAccentPackState] = useState<AccentPack>('classic')
  const [widgetStyle, setWidgetStyleState] = useState<WidgetSurfaceStyle>('default')
  const [chartStyle, setChartStyleState] = useState<ChartStyle>('smooth')
  const [mounted, setMounted] = useState(false)
  const user = useUserStore(state => state.user)

  const resolveEffective = useCallback((t: Theme): 'light' | 'dark' => {
    if (t === 'system') return getSystemTheme()
    return t
  }, [])

  const applyTheme = useCallback((t: Theme) => {
    if (typeof window === 'undefined') return
    const effective = resolveEffective(t)
    const root = window.document.documentElement
    if (effective === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
      root.style.colorScheme = 'light'
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    }
  }, [resolveEffective])

  useEffect(() => {
    setMounted(true)

    // Restore theme from localStorage as immediate source
    const savedTheme = localStorage.getItem('theme') as Theme | null
    const validThemes: Theme[] = ['light', 'dark', 'system']
    const resolved = savedTheme && validThemes.includes(savedTheme) ? savedTheme : 'dark'
    setThemeState(resolved)
    applyTheme(resolved)

    // Restore accent pack from localStorage as immediate source
    const savedAccent = localStorage.getItem('accentPack') as AccentPack | null
    const validAccents: AccentPack[] = ['classic', 'reports', 'violet']
    const resolvedAccent = savedAccent && validAccents.includes(savedAccent) ? savedAccent : 'classic'
    setAccentPackState(resolvedAccent)
    applyAccentClass(resolvedAccent)

    // Restore widget style from localStorage
    const savedWidget = localStorage.getItem('widgetStyle') as WidgetSurfaceStyle | null
    const validWidgets: WidgetSurfaceStyle[] = ['default', 'glass']
    const resolvedWidget = savedWidget && validWidgets.includes(savedWidget) ? savedWidget : 'default'
    setWidgetStyleState(resolvedWidget)

    // Restore chart style from localStorage
    const savedChart = localStorage.getItem('chartStyle') as ChartStyle | null
    const validCharts: ChartStyle[] = ['smooth', 'sharp']
    const resolvedChart = savedChart && validCharts.includes(savedChart) ? savedChart : 'smooth'
    setChartStyleState(resolvedChart)

    // Listen for system preference changes when in system mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const current = localStorage.getItem('theme') as Theme | null
      if (current === 'system') applyTheme('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [applyTheme])

  // Sync with user profile when it loads from DB
  useEffect(() => {
    if (mounted && user) {
      if (user.theme) {
        const dbTheme = user.theme as Theme
        const currentTheme = localStorage.getItem('theme') as Theme | null
        if (dbTheme !== currentTheme) {
          setThemeState(dbTheme)
          applyTheme(dbTheme)
          localStorage.setItem('theme', dbTheme)
        }
      }
      
      if (user.accentPack) {
        const dbAccent = user.accentPack as AccentPack
        const currentAccent = localStorage.getItem('accentPack') as AccentPack | null
        if (dbAccent !== currentAccent) {
          setAccentPackState(dbAccent)
          applyAccentClass(dbAccent)
          localStorage.setItem('accentPack', dbAccent)
        }
      }

      if (user.widgetStyle) {
        const dbWidget = user.widgetStyle as WidgetSurfaceStyle
        const currentWidget = localStorage.getItem('widgetStyle') as WidgetSurfaceStyle | null
        if (dbWidget !== currentWidget) {
          setWidgetStyleState(dbWidget)
          localStorage.setItem('widgetStyle', dbWidget)
        }
      }

      if (user.chartStyle) {
        const dbChart = user.chartStyle as ChartStyle
        const currentChart = localStorage.getItem('chartStyle') as ChartStyle | null
        if (dbChart !== currentChart) {
          setChartStyleState(dbChart)
          localStorage.setItem('chartStyle', dbChart)
        }
      }
    }
  }, [user, mounted, applyTheme])

  useEffect(() => {
    if (mounted) {
      applyTheme(theme)
      localStorage.setItem('theme', theme)
    }
  }, [theme, mounted, applyTheme])

  useEffect(() => {
    if (mounted) {
      applyAccentClass(accentPack)
      localStorage.setItem('accentPack', accentPack)
    }
  }, [accentPack, mounted])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('widgetStyle', widgetStyle)
    }
  }, [widgetStyle, mounted])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('chartStyle', chartStyle)
    }
  }, [chartStyle, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    // Persist to backend
    fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: newTheme }),
    }).catch(() => {})
  }

  const setAccentPack = (pack: AccentPack) => {
    setAccentPackState(pack)
    // Persist to backend
    fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accentPack: pack }),
    }).catch(() => {})
  }

  const setWidgetStyle = (style: WidgetSurfaceStyle) => {
    setWidgetStyleState(style)
    fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgetStyle: style }),
    }).catch(() => {})
  }

  const setChartStyle = (style: ChartStyle) => {
    setChartStyleState(style)
    fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chartStyle: style }),
    }).catch(() => {})
  }

  const toggleTheme = () => {
    const nextTheme = resolveEffective(theme) === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  const value = {
    theme,
    effectiveTheme: resolveEffective(theme),
    accentPack,
    widgetStyle,
    chartStyle,
    setTheme,
    setAccentPack,
    setWidgetStyle,
    setChartStyle,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
