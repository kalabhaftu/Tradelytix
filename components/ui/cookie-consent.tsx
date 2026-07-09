"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Cookie, X } from "lucide-react"

const COOKIE_CONSENT_KEY = "jji-cookie-consent"

interface ConsentSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<ConsentSettings>({
    essential: true, // Always true
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!savedConsent) {
      // Delay slightly for better UX
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }

    // Dev shortcut: Cmd/Ctrl + Shift + K to reset consent
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "K") {
        localStorage.removeItem(COOKIE_CONSENT_KEY)
        setVisible(true)
      }
    }

    const handleOpenPreferences = () => {
      setVisible(true)
      setShowPreferences(true)
    }

    window.addEventListener("keydown", handleKeyPress)
    window.addEventListener("openCookiePreferences", handleOpenPreferences)
    
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
      window.removeEventListener("openCookiePreferences", handleOpenPreferences)
    }
  }, [])

  useEffect(() => {
    if (visible) {
      document.body.setAttribute("data-consent-banner", "visible")
    } else {
      document.body.removeAttribute("data-consent-banner")
    }
    return () => {
      document.body.removeAttribute("data-consent-banner")
    }
  }, [visible])

  const handleAcceptAll = () => {
    const allConsent = { essential: true, analytics: true, marketing: true }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(allConsent))
    setPreferences(allConsent)
    setVisible(false)
  }

  const handleAcceptEssential = () => {
    const essentialOnly = { essential: true, analytics: false, marketing: false }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(essentialOnly))
    setPreferences(essentialOnly)
    setVisible(false)
  }

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences))
    setVisible(false)
  }

  const togglePreference = (key: keyof ConsentSettings) => {
    if (key === 'essential') return; // Cannot toggle essential
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 md:left-6 md:right-auto md:max-w-[420px]"
        >
          <div className="bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl overflow-hidden p-6 relative dark:shadow-primary/5">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground h-8 w-8 rounded-full"
              onClick={handleAcceptEssential}
              aria-label="Close cookie consent panel"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                  <Cookie className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg tracking-tight">We value your privacy</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                </p>
                
                {showPreferences && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-3 py-3 border-y border-border/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">Essential</span>
                        <p className="text-xs text-muted-foreground">Required for the site to function</p>
                      </div>
                      <div className="w-10 h-5 bg-primary rounded-full relative opacity-50 cursor-not-allowed">
                        <div className="absolute right-1 top-1 w-3 h-3 bg-background rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => togglePreference('analytics')}>
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">Analytics</span>
                        <p className="text-xs text-muted-foreground">Help us improve our service</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${preferences.analytics ? 'bg-primary' : 'bg-muted'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-background rounded-full transition-all ${preferences.analytics ? 'right-1' : 'left-1'}`} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => togglePreference('marketing')}>
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">Marketing</span>
                        <p className="text-xs text-muted-foreground">Used for targeted advertising</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${preferences.marketing ? 'bg-primary' : 'bg-muted'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-background rounded-full transition-all ${preferences.marketing ? 'right-1' : 'left-1'}`} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button 
                    className="flex-1 font-medium rounded-xl" 
                    onClick={showPreferences ? handleSavePreferences : handleAcceptAll}
                  >
                    {showPreferences ? 'Save Preferences' : 'Accept All'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 font-medium rounded-xl" 
                    onClick={() => setShowPreferences(!showPreferences)}
                  >
                    {showPreferences ? 'Back' : 'Customize'}
                  </Button>
                </div>
                {!showPreferences && (
                  <div className="text-center mt-1">
                    <button 
                      onClick={handleAcceptEssential}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                    >
                      Reject Non-Essential
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
