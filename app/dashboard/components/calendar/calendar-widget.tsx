'use client'

import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react"
import { format, addMonths, subMonths, getYear } from "date-fns"
import { enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Camera, ImageIcon, Sparkles } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import html2canvas from 'html2canvas'
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CalendarModal } from "./daily-modal"
import { WeeklyModal } from "./weekly-modal"
import { CalendarSettings } from "./calendar-settings"
import { useCalendarViewStore } from "@/store/calendar-view"
import { useCalendarNotes } from "@/app/dashboard/hooks/use-calendar-notes"
import { useUserStore } from "@/store/user-store"
import { useWidgetData } from "@/hooks/use-widget-data"
import { CalendarData } from "@/app/dashboard/types/calendar"
import { WidgetCard } from "../widget-card"

// New Components
import MonthlyView from "./monthly-view"
import YearlyView from "./yearly-view"
import { Logo } from "@/components/logo"

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${value.toFixed(0)}`
}

interface CalendarPnlProps {
  size?: any;
  className?: string;
}

const CalendarPnl = memo(function CalendarPnl({ className }: CalendarPnlProps) {
  const timezone = useUserStore(state => state.timezone)
  const { data: serverCalendarData, isLoading } = useWidgetData('calendarData')

  const dateLocale = enUS
  const [currentDate, setCurrentDate] = useState(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)

  const { refetchNotes } = useCalendarNotes()

  // View Store
  const { viewMode, setViewMode, selectedDate, setSelectedDate, selectedWeekDate, setSelectedWeekDate } = useCalendarViewStore()
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)

  useEffect(() => {
    const handleNotesSaved = () => refetchNotes()
    window.addEventListener('notesSaved', handleNotesSaved)
    return () => window.removeEventListener('notesSaved', handleNotesSaved)
  }, [refetchNotes])

  // Construct Calendar Data entirely from the server 
  const localCalendarData = useMemo(() => {
    return (serverCalendarData as CalendarData) || {}
  }, [serverCalendarData])


  const handleScreenshot = useCallback(async (withGradient: boolean) => {
    if (!calendarRef.current) return

    try {
      toast.info("Capturing screenshot...")

      const rect = calendarRef.current.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const scale = Math.max(dpr, 2)

      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
      const resolvedBg = bgColor ? `hsl(${bgColor})` : '#0d0d0d'

      // Capture just the card — no extra padding, no logo inside
      const cardCanvas = await html2canvas(calendarRef.current, {
        backgroundColor: resolvedBg,
        scale,
        logging: false,
        useCORS: true,
        windowWidth: Math.round(rect.width),
        windowHeight: Math.round(rect.height),
        onclone: (_clonedDoc, clonedElem) => {
          clonedElem.style.width = `${rect.width}px`
          clonedElem.style.height = `${rect.height}px`
          clonedElem.style.overflow = 'hidden'
          // Hide the screenshot camera button
          clonedElem.querySelectorAll('.screenshot-btn').forEach((el) => {
            (el as HTMLElement).style.display = 'none'
          })
        },
      })

      // Logo bar height in logical pixels — same as in the reference
      const logoBarHeight = 52
      const cardW = cardCanvas.width
      const cardH = cardCanvas.height
      const padding = withGradient ? Math.round(24 * scale) : 0
      const totalW = cardW + padding * 2
      const totalH = cardH + padding * 2 + Math.round(logoBarHeight * scale)

      // Compose onto a new canvas
      const out = document.createElement('canvas')
      out.width = totalW
      out.height = totalH
      const ctx = out.getContext('2d')!

      if (withGradient) {
        const grad = ctx.createLinearGradient(0, 0, totalW, totalH)
        grad.addColorStop(0, '#0f0c29')
        grad.addColorStop(0.5, '#302b63')
        grad.addColorStop(1, '#24243e')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, totalW, totalH)

        // Draw card with shadow + rounded corners
        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.55)'
        ctx.shadowBlur = 60 * scale
        ctx.shadowOffsetY = 12 * scale
        const r = 16 * scale
        ctx.beginPath()
        ctx.moveTo(padding + r, padding)
        ctx.lineTo(padding + cardW - r, padding)
        ctx.quadraticCurveTo(padding + cardW, padding, padding + cardW, padding + r)
        ctx.lineTo(padding + cardW, padding + cardH - r)
        ctx.quadraticCurveTo(padding + cardW, padding + cardH, padding + cardW - r, padding + cardH)
        ctx.lineTo(padding + r, padding + cardH)
        ctx.quadraticCurveTo(padding, padding + cardH, padding, padding + cardH - r)
        ctx.lineTo(padding, padding + r)
        ctx.quadraticCurveTo(padding, padding, padding + r, padding)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(cardCanvas, padding, padding)
        ctx.restore()
      } else {
        ctx.drawImage(cardCanvas, 0, 0)
      }

      // Draw logo bar at the bottom — always outside the card
      const barY = padding + cardH + (withGradient ? padding : 0)
      ctx.fillStyle = withGradient ? 'rgba(255,255,255,0.0)' : resolvedBg
      ctx.fillRect(0, barY, totalW, Math.round(logoBarHeight * scale))

      // Logo text
      const fontSize = Math.round(13 * scale)
      ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, "Inter", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = withGradient ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)'
      ctx.letterSpacing = `${Math.round(3 * scale)}px`
      const logoY = barY + Math.round((logoBarHeight / 2) * scale)
      ctx.fillText('△  DELTALYTIX', totalW / 2, logoY)

      out.toBlob((blob) => {
        if (!blob) { toast.error("Failed to capture screenshot"); return }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `calendar-${format(currentDate, 'yyyy-MM')}${withGradient ? '-styled' : ''}.png`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("Screenshot saved!")
      }, 'image/png')
    } catch {
      toast.error("Failed to capture screenshot")
    }
  }, [currentDate])

  // Navigation
  const handlePrev = useCallback(() => {
    if (viewMode === 'daily') setCurrentDate(prev => subMonths(prev, 1))
    else setCurrentDate(prev => new Date(getYear(prev) - 1, 0, 1))
  }, [viewMode])

  const handleNext = useCallback(() => {
    if (viewMode === 'daily') setCurrentDate(prev => addMonths(prev, 1))
    else setCurrentDate(prev => new Date(getYear(prev) + 1, 0, 1))
  }, [viewMode])

  // Stats Calculation for Header
  const displayTotal = useMemo(() => {
    let total = 0
    if (viewMode === 'daily') {
      const currentMonthPrefix = format(currentDate, 'yyyy-MM')
      Object.entries(localCalendarData).forEach(([key, data]) => {
        if (key.startsWith(currentMonthPrefix)) {
          total += data.pnl
        }
      })
    } else {
      const currentYearPrefix = String(getYear(currentDate))
      Object.entries(localCalendarData).forEach(([key, data]) => {
        if (key.startsWith(currentYearPrefix)) {
          total += data.pnl
        }
      })
    }
    return total
  }, [localCalendarData, currentDate, viewMode])

  const isPositive = displayTotal >= 0

  const tradedDaysCount = useMemo(() => {
    let count = 0;
    if (viewMode === 'daily') {
      const currentMonthPrefix = format(currentDate, 'yyyy-MM')
      Object.entries(localCalendarData).forEach(([key, data]) => {
        if (key.startsWith(currentMonthPrefix) && data.tradeNumber > 0) count++
      })
    } else {
      const currentYearPrefix = String(getYear(currentDate))
      Object.entries(localCalendarData).forEach(([key, data]) => {
        if (key.startsWith(currentYearPrefix) && data.tradeNumber > 0) count++
      })
    }
    return count;
  }, [localCalendarData, currentDate, viewMode])

  // Header right content — settings gear + snapshot dropdown
  const headerControls = (
    <div className="flex items-center gap-1.5">
      {/* Snapshot dropdown — icon only, hidden in screenshot output */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="screenshot-btn h-7 w-7 hover:bg-primary/5 hover:text-primary transition-all bg-muted/20 border border-border/30 rounded-lg"
          >
            <Camera className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => handleScreenshot(false)} className="gap-2 text-xs font-medium">
            <ImageIcon className="h-3.5 w-3.5" />
            Basic
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleScreenshot(true)} className="gap-2 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            With Gradient
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings gear */}
      <CalendarSettings />
    </div>
  )

  return (
    <div id="advanced-calendar-capture" ref={calendarRef} data-screenshot-wrap className={cn("h-full w-full", className)}>
      <WidgetCard
        noPadding
        data-widget-card="true"
        className="overflow-hidden flex flex-col h-full"
      >
        {/* Unified Header: Navigation + Stats + Controls */}
        <div className="flex flex-row flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border/20 bg-muted/5 flex-shrink-0">
          {/* Left side: Navigation + This month button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Navigation Group */}
            <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5 border border-border/30 font-bold shrink-0">
              <Button variant="ghost" size="icon" onClick={handlePrev} className="h-7 w-7 hover:bg-background" aria-label="Previous">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <div className="px-2 min-w-[80px] sm:min-w-[90px] text-center">
                <span className="text-[10px] sm:text-[11px] font-black capitalize tracking-tight">
                  {viewMode === 'daily'
                    ? format(currentDate, 'MMM yyyy')
                    : format(currentDate, 'yyyy')
                  }
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleNext} className="h-7 w-7 hover:bg-background" aria-label="Next">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* This month button — consistent height with nav group */}
            <Button
              onClick={() => setCurrentDate(new Date())}
              variant="outline"
              className="h-7 px-2.5 text-[10px] font-black bg-muted/20 hover:bg-muted border-border/40 transition-colors hidden sm:inline-flex"
            >
              This month
            </Button>
          </div>

          {/* Right side: Stats + View switcher + Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Stats label - hide on mobile */}
            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground hidden md:block">
              {viewMode === 'daily' ? 'Monthly:' : 'Yearly:'}
            </span>

            {/* Stats Badges */}
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
              <div className={cn(
                "px-1.5 py-0.5 rounded border shadow-sm flex items-center",
                isPositive ? "bg-long/10 border-long/20 text-long" : "bg-short/10 border-short/20 text-short"
              )}>
                {formatCompact(displayTotal)}
              </div>
              <div className="px-1.5 py-0.5 rounded bg-chart-4/10 border border-chart-4/20 text-chart-4 border-solid shadow-sm">
                {tradedDaysCount}d
              </div>
            </div>

            <div className="w-px h-4 bg-border/40 hidden sm:block" />

            {/* View Switcher — hide on small screens */}
            <div className="hidden md:flex items-center p-0.5 bg-muted/30 border border-border/30 rounded-lg">
              <button
                onClick={() => setViewMode('daily')}
                className={cn(
                  "px-2 py-1 text-[10px] font-black rounded-md transition-all",
                  viewMode === 'daily'
                    ? "bg-background shadow-sm text-foreground border border-border/40"
                    : "text-muted-foreground/50 hover:text-foreground"
                )}
              >
                Daily
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={cn(
                  "px-2 py-1 text-[10px] font-black rounded-md transition-all",
                  viewMode === 'weekly'
                    ? "bg-background shadow-sm text-foreground border border-border/40"
                    : "text-muted-foreground/50 hover:text-foreground"
                )}
              >
                Yearly
              </button>
            </div>

            {headerControls}
          </div>
        </div>

        {/* Calendar Content - fully responsive without horizontal scroll */}
        <div className="flex-1 min-h-0 overflow-auto relative">
          <div className="h-full flex flex-col">
            {viewMode === 'daily' ? (
            <MonthlyView
              currentDate={currentDate}
              calendarData={localCalendarData}
              onSelectDate={setSelectedDate}
              onReviewWeek={(date) => {
                setSelectedWeekDate(date)
                setShowWeeklyModal(true)
              }}
            />
          ) : (
            <YearlyView
              year={getYear(currentDate)}
              calendarData={localCalendarData}
            />
            )}
          </div>
        </div>

        <CalendarModal
          isOpen={selectedDate !== null}
          onOpenChange={(open) => !open && setSelectedDate(null)}
          selectedDate={selectedDate}
          dayData={selectedDate ? localCalendarData[format(selectedDate, 'yyyy-MM-dd')] : undefined}
          isLoading={isLoading}
        />
      </WidgetCard>

      <WeeklyModal
        isOpen={showWeeklyModal}
        onOpenChange={setShowWeeklyModal}
        selectedDate={selectedWeekDate || new Date()}
        calendarData={localCalendarData}
        isLoading={isLoading}
      />
    </div>
  )
})

export default CalendarPnl
