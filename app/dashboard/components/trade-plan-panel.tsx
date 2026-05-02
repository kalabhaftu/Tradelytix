"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Target, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export interface TradePlan {
  plannedEntry: string
  plannedStopLoss: string
  plannedTakeProfit: string
  plannedSize: string
  planNotes: string
}

interface TradePlanPanelProps {
  plan: Partial<TradePlan>
  actual?: {
    entryPrice?: string | null
    stopLoss?: string | null
    takeProfit?: string | null
    quantity?: number | null
  }
  onChange?: (plan: Partial<TradePlan>) => void
  readOnly?: boolean
  className?: string
}

function deviation(planned: string, actual: string | null | undefined): { pct: number; label: string } | null {
  const p = parseFloat(planned)
  const a = parseFloat(actual || '')
  if (isNaN(p) || isNaN(a) || p === 0) return null
  const pct = ((a - p) / Math.abs(p)) * 100
  return { pct, label: pct >= 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%` }
}

export function TradePlanPanel({ plan, actual, onChange, readOnly = false, className }: TradePlanPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  const entryDev = actual ? deviation(plan.plannedEntry || '', actual.entryPrice) : null
  const slDev = actual ? deviation(plan.plannedStopLoss || '', actual.stopLoss) : null
  const tpDev = actual ? deviation(plan.plannedTakeProfit || '', actual.takeProfit) : null

  const planFilled = Boolean(plan.plannedEntry || plan.plannedStopLoss || plan.plannedTakeProfit)
  const hasActual = Boolean(actual?.entryPrice)

  return (
    <div className={cn("rounded-[20px] border border-border/20 bg-card/50 overflow-hidden", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-black uppercase tracking-wider">Trade Plan vs Actual</span>
              {planFilled && hasActual && (
                <CheckCircle2 className="h-3.5 w-3.5 text-long" />
              )}
            </div>
            {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/40" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Column headers */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 text-left">Field</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Planned</span>
              {hasActual && <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Actual</span>}
            </div>

            {/* Entry */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-[10px] font-bold text-muted-foreground">Entry</span>
              {readOnly ? (
                <span className="text-[11px] font-mono text-center font-bold">{plan.plannedEntry || '—'}</span>
              ) : (
                <Input
                  type="number"
                  step="any"
                  value={plan.plannedEntry || ''}
                  onChange={e => onChange?.({ ...plan, plannedEntry: e.target.value })}
                  className="h-7 text-[11px] text-center font-mono"
                  placeholder="0.00"
                />
              )}
              {hasActual && (
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-mono font-bold">{actual?.entryPrice || '—'}</span>
                  {entryDev && (
                    <span className={cn("text-[9px] font-bold", Math.abs(entryDev.pct) < 0.5 ? "text-long" : "text-warning")}>
                      {entryDev.label}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Stop Loss */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-[10px] font-bold text-muted-foreground">Stop Loss</span>
              {readOnly ? (
                <span className="text-[11px] font-mono text-center font-bold">{plan.plannedStopLoss || '—'}</span>
              ) : (
                <Input
                  type="number"
                  step="any"
                  value={plan.plannedStopLoss || ''}
                  onChange={e => onChange?.({ ...plan, plannedStopLoss: e.target.value })}
                  className="h-7 text-[11px] text-center font-mono"
                  placeholder="0.00"
                />
              )}
              {hasActual && (
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-mono font-bold">{actual?.stopLoss || '—'}</span>
                  {slDev && (
                    <span className={cn("text-[9px] font-bold", Math.abs(slDev.pct) < 1 ? "text-long" : "text-warning")}>
                      {slDev.label}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Take Profit */}
            <div className="grid grid-cols-3 gap-2 items-center">
              <span className="text-[10px] font-bold text-muted-foreground">Take Profit</span>
              {readOnly ? (
                <span className="text-[11px] font-mono text-center font-bold">{plan.plannedTakeProfit || '—'}</span>
              ) : (
                <Input
                  type="number"
                  step="any"
                  value={plan.plannedTakeProfit || ''}
                  onChange={e => onChange?.({ ...plan, plannedTakeProfit: e.target.value })}
                  className="h-7 text-[11px] text-center font-mono"
                  placeholder="0.00"
                />
              )}
              {hasActual && (
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-mono font-bold">{actual?.takeProfit || '—'}</span>
                  {tpDev && (
                    <span className={cn("text-[9px] font-bold", Math.abs(tpDev.pct) < 1 ? "text-long" : "text-warning")}>
                      {tpDev.label}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Plan Notes */}
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Pre-trade notes</Label>
              {readOnly ? (
                <p className="text-[11px] text-muted-foreground min-h-[40px]">{plan.planNotes || '—'}</p>
              ) : (
                <Textarea
                  value={plan.planNotes || ''}
                  onChange={e => onChange?.({ ...plan, planNotes: e.target.value })}
                  placeholder="What is your thesis? Key confluences..."
                  className="text-[11px] min-h-[60px] resize-none"
                />
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
