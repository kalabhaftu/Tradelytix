'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Smartphone } from 'lucide-react'
import { Button } from './ui/button'

export function AppBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isBannerDismissed = localStorage.getItem('jji_app_banner_dismissed') === 'true'
    
    if (isMobile && !isBannerDismissed) {
      setShow(true)
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('jji_app_banner_dismissed', 'true')
  }

  const handleOpenApp = () => {
    const path = window.location.pathname + window.location.search
    const deepLinkUrl = `jji://open?path=${encodeURIComponent(path)}`
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = deepLinkUrl
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 p-4 rounded-xl border border-border bg-card shadow-2xl flex items-center justify-between gap-4 max-w-md mx-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Open in JJI App</h4>
            <p className="text-xs text-muted-foreground text-left">Get a native charts experience.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleOpenApp} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-8">
            Open
          </Button>
          <button 
            onClick={handleDismiss} 
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Dismiss app banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
