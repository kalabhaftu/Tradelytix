'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlugZap, UploadCloud, LineChart, Filter } from "lucide-react"
import Link from "next/link"

interface EmptyTradeStateProps {
  onOpenAccountSelector?: () => void
}

export function EmptyTradeState({ onOpenAccountSelector }: EmptyTradeStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 lg:p-8 animate-in fade-in zoom-in duration-500">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-primary/10 rounded-full flex items-center justify-center before:absolute before:inset-0 before:bg-primary/5 before:rounded-full before:animate-ping before:duration-1000">
          <LineChart className="h-12 w-12 sm:h-16 sm:w-16 text-primary" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Your Trading Journey Starts Here
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            You don&apos;t have any trades yet. Select a different account, connect your broker for automatic syncing, or import your trades manually.
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
            className="w-full h-14 text-base font-semibold border-primary/20 hover:bg-muted/50 transition-all group"
          >
            <Filter className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform text-primary" />
            Select Account
          </Button>
          <Link href="/dashboard/accounts" passHref className="">
            <Button size="lg" className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-primary/25 transition-all group">
              <PlugZap className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Connect Broker
            </Button>
          </Link>
          <Link href="/dashboard/import" passHref className="">
            <Button size="lg" variant="outline" className="w-full h-14 text-base font-semibold hover:bg-muted/50 transition-all group border-primary/20">
              <UploadCloud className="mr-2 h-5 w-5 group-hover:-translate-y-1 transition-transform text-primary" />
              Import Trades
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
