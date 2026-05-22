'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

const POLICY_DATE = 'May 21, 2026'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-lg font-bold tracking-tight text-foreground">Tradelytix</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition-colors gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="space-y-10">
          <section>
            <h1 className="text-3xl font-bold tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground leading-relaxed">Last updated: {POLICY_DATE}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">What we collect</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Tradelytix collects the information needed to provide trading analytics, journaling, reports, account management, subscriptions, support, and security.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>Authentication details from Supabase Auth and your chosen sign-in method.</li>
              <li>Trading data, screenshots, notes, tags, playbooks, settings, and imports you provide.</li>
              <li>Payment and subscription records needed to manage paid access.</li>
              <li>Operational logs, error reports, IP-derived security metadata, and device/browser metadata needed to protect and debug the service.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Service providers</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              We do not sell trading data. We use service providers only to operate Tradelytix, including Supabase for database, auth, and storage; NOWPayments for crypto payment processing; Vercel or hosting infrastructure for deployment/logs; and Sentry/error reporting if configured for production monitoring.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Cookies and local storage</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Tradelytix uses essential cookies, local storage, and session storage for authentication, preferences, theme, security, and app functionality. We do not use advertising cookies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Your controls</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              You can export, back up, and delete your trading data from the app. Account deletion removes your user data subject to operational, payment, legal, and abuse-prevention retention requirements.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Security</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              We use authentication, server-side authorization checks, rate limits, payment webhook verification, storage policies, logging, and production monitoring to protect user data. No internet service can guarantee perfect security, but we design Tradelytix to minimize unnecessary exposure.
            </p>
          </section>

          <footer className="pt-10 border-t border-border/40 space-y-3">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
              <Link href="/contact" className="hover:text-foreground">Contact</Link>
            </div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
              &copy; 2026 Tradelytix — Privacy First
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  )
}
