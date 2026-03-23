'use client'

import React, { useState, useMemo, useCallback, useRef } from "react"
import { format, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight, Camera, ImageIcon, Sparkles } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import html2canvas from 'html2canvas'
import { toast } from "sonner"
import { WidgetCard } from '../widget-card'
import { Button } from "@/components/ui/button"
import { CalendarData } from "@/app/dashboard/types/calendar"
import { useData } from "@/context/data-provider"
import MonthlyView from "./monthly-view"
import { Logo } from "@/components/logo"

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${value.toFixed(0)}`
}

interface MiniCalendarProps {
  calendarData: CalendarData;
}

function MiniCalendar({ calendarData }: MiniCalendarProps) {
  const { isLoading } = useData()
  const [currentDate, setCurrentDate] = useState(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)

  const handleScreenshot = useCallback(async (withGradient: boolean) => {
    if (!calendarRef.current) return
    try {
      toast.info("Capturing screenshot...")

      const rect = calendarRef.current.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      // Resolve the background color from CSS variable
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
      const resolvedBg = bgColor ? `hsl(${bgColor})` : '#0d0d0d'

      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: withGradient ? null : resolvedBg,
        scale: Math.max(dpr, 2),
        logging: false,
        useCORS: true,
        windowWidth: Math.round(rect.width),
        windowHeight: Math.round(rect.height),
        onclone: (clonedDoc, clonedElem) => {
          clonedElem.style.width = `${rect.width}px`
          clonedElem.style.height = `${rect.height}px`
          clonedElem.style.overflow = 'hidden'

          if (withGradient) {
            clonedElem.style.background = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
            clonedElem.style.padding = '16px'
            clonedElem.style.borderRadius = '20px'
          }

          const card = clonedElem.querySelector('[data-widget-card]') as HTMLElement
          if (card) {
            card.style.background = resolvedBg
            if (withGradient) {
              card.style.boxShadow = '0 20px 40px -12px rgba(0,0,0,0.5)'
              card.style.borderRadius = '16px'
            }
          }

          // Hide screenshot button in capture
          clonedElem.querySelectorAll('.screenshot-btn').forEach((el) => {
            (el as HTMLElement).style.display = 'none'
          })

          // Show watermark
          const watermark = clonedDoc.getElementById('mini-calendar-watermark')
          if (watermark) {
            watermark.style.display = 'flex'
          }
        },
      })

      canvas.toBlob((blob) => {
        if (!blob) { toast.error("Failed to capture screenshot"); return }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `mini-calendar-${format(currentDate, 'yyyy-MM')}${withGradient ? '-styled' : ''}.png`
        link.click()
        URL.revokeObjectURL(url)
        toast.success("Screenshot saved!")
      }, 'image/png')
    } catch {
      toast.error("Failed to capture screenshot")
    }
  }, [currentDate])

  const handlePrev = useCallback(() => setCurrentDate(prev => subMonths(prev, 1)), [])
  const handleNext = useCallback(() => setCurrentDate(prev => addMonths(prev, 1)), [])

  const displayTotal = useMemo(() => {
    let total = 0
    const prefix = format(currentDate, 'yyyy-MM')
    Object.entries(calendarData).forEach(([key, data]) => {
      if (key.startsWith(prefix)) total += data.pnl
    })
    return total
  }, [calendarData, currentDate])

  const isPositive = displayTotal >= 0

  const tradedDaysCount = useMemo(() => {
    let count = 0
    const prefix = format(currentDate, 'yyyy-MM')
    Object.entries(calendarData).forEach(([key, data]) => {
      if (key.startsWith(prefix) && data.tradeNumber > 0) count++
    })
    return count
  }, [calendarData, currentDate])

  return (
    // Outer wrapper is what html2canvas captures — it covers the full widget area
    <div ref={calendarRef} className="w-full h-full relative">
      <WidgetCard noPadding data-widget-card="true" className="overflow-hidden flex flex-col h-full">

        {/* ── Single-line header ── */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/20 bg-muted/5 flex-shrink-0 min-w-0">

          {/* Left: nav + month label */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5 border border-border/30">
              <Button variant="ghost" size="icon" onClick={handlePrev} className="h-6 w-6 hover:bg-background" aria-label="Previous month">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] font-black tracking-tight px-2 min-w-[80px] text-center">
                {format(currentDate, 'MMM yyyy')}
              </span>
              <Button variant="ghost" size="icon" onClick={handleNext} className="h-6 w-6 hover:bg-background" aria-label="Next month">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              onClick={() => setCurrentDate(new Date())}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[9px] font-black hidden sm:inline-flex"
            >
              Today
            </Button>
          </div>

          {/* Right: stats + snapshot (hidden in screenshot) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={
              "px-1.5 py-0.5 rounded border text-[10px] font-black " +
              (isPositive ? "bg-long/10 border-long/20 text-long" : "bg-short/10 border-short/20 text-short")
            }>
              {formatCompact(displayTotal)}
            </div>
            <div className="px-1.5 py-0.5 rounded bg-chart-4/10 border border-chart-4/20 text-chart-4 text-[10px] font-black">
              {tradedDaysCount}d
            </div>
            {/* Screenshot dropdown — icon only, hidden in screenshot */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-6 w-6 p-0 screenshot-btn"
                  variant="ghost"
                  size="icon"
                  aria-label="Take screenshot"
                >
                  <Camera className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => handleScreenshot(false)} className="gap-2 text-xs font-medium">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Basic
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleScreenshot(true)} className="gap-2 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  Gradient
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <MonthlyView
            hideWeekends
            currentDate={currentDate}
            calendarData={calendarData}
            isMiniCalendar={true}
          />
        </div>

        {/* Persistent branded footer */}
        <div className="flex items-center justify-center gap-2 py-1.5 px-3 border-t border-border/20 bg-muted/5 flex-shrink-0">
          <Logo className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            Deltalytix
          </span>
        </div>
      </WidgetCard>

      {/* Watermark overlay — hidden normally, shown only in screenshot clone */}
      <div
        id="mini-calendar-watermark"
        className="hidden absolute bottom-0 left-0 right-0 items-center justify-center gap-2.5 py-3 bg-muted/10 border-t border-border/20"
      >
        <Logo className="w-5 h-5 text-foreground/70" />
        <span className="text-sm font-black uppercase tracking-[0.2em] text-foreground/70">Deltalytix</span>
      </div>
    </div>
  )
}

export default React.memo(MiniCalendar, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.calendarData) === JSON.stringify(nextProps.calendarData)
})
