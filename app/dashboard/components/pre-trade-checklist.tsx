"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export interface ChecklistItem {
  id: string
  label: string
  checked: boolean
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "bias", label: "Market bias confirmed on HTF", checked: false },
  { id: "session", label: "In preferred trading session", checked: false },
  { id: "structure", label: "Structure point (MS/BOS) identified", checked: false },
  { id: "poi", label: "Point of Interest (POI) marked", checked: false },
  { id: "sl_defined", label: "Stop loss level defined", checked: false },
  { id: "rr", label: "R:R is at least 1:2", checked: false },
  { id: "news", label: "No high-impact news in window", checked: false },
  { id: "daily_limit", label: "Daily loss limit not exceeded", checked: false },
]

interface PreTradeChecklistProps {
  onAllChecked?: () => void
  className?: string
}

export function PreTradeChecklist({ onAllChecked, className }: PreTradeChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST)
  const [isOpen, setIsOpen] = useState(true)

  const toggle = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
      const allChecked = next.every(i => i.checked)
      if (allChecked) onAllChecked?.()
      return next
    })
  }, [onAllChecked])

  const reset = useCallback(() => {
    setItems(DEFAULT_CHECKLIST.map(i => ({ ...i, checked: false })))
  }, [])

  const checkedCount = items.filter(i => i.checked).length
  const totalCount = items.length
  const allChecked = checkedCount === totalCount
  const progressPct = (checkedCount / totalCount) * 100

  return (
    <div className={cn("rounded-[20px] border border-border/20 bg-card/50 overflow-hidden", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-black uppercase tracking-wider">Pre-Trade Checklist</span>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                allChecked ? "bg-long/10 text-long" : "bg-muted/30 text-muted-foreground"
              )}>
                {checkedCount}/{totalCount}
              </span>
            </div>
            {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/40" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* Progress bar */}
          <div className="mx-4 mb-3 h-1 bg-muted/20 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", allChecked ? "bg-long" : "bg-primary")}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="px-3 pb-3 space-y-1">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-muted/20",
                  item.checked && "opacity-60"
                )}
              >
                {item.checked ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-long" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                )}
                <span className={cn(
                  "text-[11px] font-semibold",
                  item.checked ? "line-through text-muted-foreground/50" : "text-foreground"
                )}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="px-4 pb-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-[9px] font-black uppercase tracking-widest h-6 px-2 text-muted-foreground/40 hover:text-muted-foreground"
            >
              Reset
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
