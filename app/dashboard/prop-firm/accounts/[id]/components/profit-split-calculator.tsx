"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { DollarSign, Calculator } from "lucide-react"

interface ProfitSplitCalculatorProps {
  currentPnL: number
  accountSize: number
}

export function ProfitSplitCalculator({ currentPnL, accountSize }: ProfitSplitCalculatorProps) {
  const [traderSplitPct, setTraderSplitPct] = useState(80)

  if (currentPnL <= 0) return null

  const traderCut = (traderSplitPct / 100) * currentPnL
  const firmCut = currentPnL - traderCut
  const returnOnAccount = (currentPnL / accountSize) * 100

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)

  return (
    <Card className="border-border/20 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Payout Estimator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Gross profits summary */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Gross profit in phase</span>
          <span className="text-sm font-bold text-long">{fmt(currentPnL)}</span>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-bold uppercase tracking-wider">Your split</span>
            <span className="font-black text-foreground">{traderSplitPct}%</span>
          </div>
          <Slider
            value={[traderSplitPct]}
            min={50}
            max={95}
            step={5}
            onValueChange={([v]) => setTraderSplitPct(v)}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground/40 font-bold">
            <span>50%</span>
            <span>95%</span>
          </div>
        </div>

        {/* Result bars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-long/10 border border-long/20">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-long" />
              <span className="text-xs font-black uppercase tracking-wider text-long">Your payout</span>
            </div>
            <span className="text-base font-black font-mono text-long">{fmt(traderCut)}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/20">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Firm share</span>
            </div>
            <span className="text-base font-black font-mono text-muted-foreground">{fmt(firmCut)}</span>
          </div>
        </div>

        <p className="text-[9px] text-muted-foreground/40 font-medium text-center">
          {returnOnAccount.toFixed(1)}% return on {fmt(accountSize)} account
        </p>
      </CardContent>
    </Card>
  )
}
