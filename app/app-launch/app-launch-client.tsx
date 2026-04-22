"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase"

interface AppLaunchClientProps {
  nextPath: string
}

export function AppLaunchClient({ nextPath }: AppLaunchClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState("Checking your session...")

  useEffect(() => {
    let cancelled = false

    const redirectToLogin = () => {
      if (!cancelled) {
        router.replace(`/?next=${encodeURIComponent(nextPath)}`)
      }
    }

    const bootstrap = async () => {
      try {
        const authCheck = await fetch("/api/auth/check", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        })

        if (authCheck.ok) {
          const authData = await authCheck.json().catch(() => null)
          if (!cancelled && authData?.authenticated) {
            setStatus("Opening dashboard...")
            router.replace(nextPath)
            return
          }
        }

        setStatus("Restoring secure session...")
        const supabase = createClient()
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error || !session?.access_token || !session.refresh_token) {
          redirectToLogin()
          return
        }

        const restoreResponse = await fetch("/api/auth/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          }),
        })

        if (!restoreResponse.ok) {
          redirectToLogin()
          return
        }

        if (!cancelled) {
          setStatus("Opening dashboard...")
          router.replace(nextPath)
        }
      } catch {
        redirectToLogin()
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [nextPath, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <Spinner className="h-8 w-8 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Launching Deltalytix</p>
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
      </div>
    </div>
  )
}
