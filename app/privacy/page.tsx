'use client'

import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Tradelytix
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground transition-colors gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-10">
          <section>
            <h1 className="text-3xl font-bold tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground leading-relaxed">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Our Approach</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Tradelytix is a personal trading analytics dashboard. We believe in absolute privacy and data ownership. 
              The application is designed to give you full control over your trading data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Data Collection</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              We strictly collect only what is necessary for the application to function:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>Authentication details (only what's provided by your chosen provider).</li>
              <li>Trading data that you explicitly import or sync.</li>
              <li>App preferences and settings.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              We only use essential cookies for authentication and security purposes. 
              We do not use any tracking, advertising, or third-party analytical cookies that compromise your privacy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Third Parties</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Your data is never sold, shared, or used for any purpose other than providing you with the analytics dashboard features.
            </p>
          </section>

          <footer className="pt-10 border-t border-border/40">
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
              &copy; {new Date().getFullYear()} Tradelytix — Privacy First
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  )
}
