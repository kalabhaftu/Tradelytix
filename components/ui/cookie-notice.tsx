"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const COOKIE_KEY = "cookieConsent"

interface ConsentSettings {
  functionality_storage: boolean
  security_storage: boolean
}

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY)
    if (!consent) {
      setVisible(true)
    }

    // Dev shortcut: Cmd/Ctrl + Shift + K to reset consent
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "K") {
        localStorage.removeItem(COOKIE_KEY)
        setVisible(true)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
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

  const handleAccept = () => {
    const essentialOnly: ConsentSettings = {
      functionality_storage: true,
      security_storage: true,
    }
    localStorage.setItem(COOKIE_KEY, JSON.stringify(essentialOnly))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-6 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <Card className="w-[350px] shadow-lg rounded-2xl border bg-background text-foreground">
        <CardContent className="p-5">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🍪</span>
              <h2 className="font-semibold">Cookie Notice</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              We use only essential cookies for functionality and security. No
              tracking or advertising cookies are used.{" "}
              <Link
                href="/privacy"
                className="underline text-primary hover:text-primary/80"
              >
                Read cookies policies.
              </Link>
            </p>
            <div className="flex justify-between items-center pt-2">
              <Link
                href="/privacy"
                className="text-sm underline hover:text-primary transition"
              >
                Learn more
              </Link>
              <Button
                size="sm"
                onClick={handleAccept}
                className={cn("rounded-lg px-4 py-1")}
              >
                Accept
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
