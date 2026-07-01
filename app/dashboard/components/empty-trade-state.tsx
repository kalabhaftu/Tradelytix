'use client'

import { Button } from "@/components/ui/button"
import { PlugZap, UploadCloud, Filter } from "lucide-react"
import Link from "next/link"

interface EmptyTradeStateProps {
  onOpenAccountSelector?: () => void
}

export function EmptyTradeState({ onOpenAccountSelector }: EmptyTradeStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 lg:p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Connect Your Account to Get Started
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            No account connected yet. Sync your broker directly, import a trade history file, or select an existing account to view your data.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 pt-4 max-w-2xl mx-auto">
          <Button
            onClick={() => {
              if (onOpenAccountSelector) {
                onOpenAccountSelector()
              } else {
                window.dispatchEvent(new Event('open-account-selector'))
              }
            }}
            size="lg"
            variant="outline"
            className="w-full h-14 text-base font-semibold border-primary/20 hover:bg-muted/50 transition-colors"
          >
            <Filter className="mr-2 h-5 w-5 text-primary" />
            Select Account
          </Button>
          <Link href="/dashboard/accounts" passHref className="">
            <Button size="lg" className="w-full h-14 text-base font-semibold transition-colors">
              <PlugZap className="mr-2 h-5 w-5" />
              Connect Broker
            </Button>
          </Link>
          <Link href="/dashboard/import" passHref className="">
            <Button size="lg" variant="outline" className="w-full h-14 text-base font-semibold hover:bg-muted/50 transition-colors border-primary/20">
              <UploadCloud className="mr-2 h-5 w-5 text-primary" />
              Import Trades
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
