'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useUserStore } from '@/store/user-store'

type Theme = 'light' | 'dark' | 'system'
type AccentPack = 'classic' | 'reports'

type ThemeContextType = {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  accentPack: AccentPack
  setTheme: (theme: Theme) => void
  setAccentPack: (pack: AccentPack) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  effectiveTheme: 'dark',
  accentPack: 'classic',
  setTheme: () => {},
  setAccentPack: () => {},
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
  root.classList.remove('accent-reports')
  if (pack === 'reports') {
    root.classList.add('accent-reports')
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [accentPack, setAccentPackState] = useState<AccentPack>('classic')
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
    const validAccents: AccentPack[] = ['classic', 'reports']
    const resolvedAccent = savedAccent && validAccents.includes(savedAccent) ? savedAccent : 'classic'
    setAccentPackState(resolvedAccent)
    applyAccentClass(resolvedAccent)

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

  const toggleTheme = () => {
    const nextTheme = resolveEffective(theme) === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  const value = {
    theme,
    effectiveTheme: resolveEffective(theme),
    accentPack,
    setTheme,
    setAccentPack,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
