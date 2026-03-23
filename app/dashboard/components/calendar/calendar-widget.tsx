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
        onclone: (_clonedDoc, clonedElem) => {
          clonedElem.style.width = `${rect.width}px`
          clonedElem.style.height = `${rect.height}px`
          clonedElem.style.overflow = 'hidden'

          if (withGradient) {
            clonedElem.style.background = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
            clonedElem.style.padding = '24px'
            clonedElem.style.borderRadius = '24px'
          }

          const card = clonedElem.querySelector('[data-widget-card]') as HTMLElement
          if (card) {
            card.style.background = resolvedBg
            if (withGradient) {
              card.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.5)'
              card.style.borderRadius = '16px'
            }
          }

          // Hide screenshot buttons
          clonedElem.querySelectorAll('.screenshot-btn').forEach((el) => {
            (el as HTMLElement).style.display = 'none'
          })
        },
      })

      canvas.toBlob((blob) => {
        if (!blob) { toast.error("Failed to capture screenshot"); return }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `calendar-${format(currentDate, 'yyyy-MM')}${withGradient ? '-styled' : ''}.png`
        link.click()
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
        <div className="flex flex-row items-center justify-between gap-3 px-3 sm:px-5 py-2 sm:py-3 border-b border-border/20 bg-muted/5 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Navigation Group */}
            <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5 border border-border/30 font-bold shrink-0">
              <Button variant="ghost" size="icon" onClick={handlePrev} className="h-6 w-6 hover:bg-background" aria-label="Previous">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <div className="px-2 min-w-[90px] text-center">
                <span className="text-[11px] font-black capitalize tracking-tight">
                  {viewMode === 'daily'
                    ? format(currentDate, 'MMM yyyy')
                    : format(currentDate, 'yyyy')
                  }
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleNext} className="h-6 w-6 hover:bg-background" aria-label="Next">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              onClick={() => setCurrentDate(new Date())}
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-[10px] font-black bg-muted/20 hover:bg-muted border-border/40 transition-colors hidden sm:inline-flex"
            >
              This month
            </Button>
          </div>

          <div className="flex items-center gap-3 shrink-0 justify-end">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground mr-1">
                {viewMode === 'daily' ? 'Monthly stats:' : 'Yearly stats:'}
              </span>

              {/* Stats Badges */}
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                <div className={cn(
                  "px-1.5 py-0.5 rounded border shadow-sm flex items-center",
                  isPositive ? "bg-long/10 border-long/20 text-long" : "bg-short/10 border-short/20 text-short"
                )}>
                  {formatCompact(displayTotal)}
                </div>
                <div className="px-1.5 py-0.5 rounded bg-chart-4/10 border border-chart-4/20 text-chart-4 border-solid shadow-sm">
                  {tradedDaysCount} d
                </div>
              </div>
            </div>

            <div className="w-px h-4 bg-border/40 hidden sm:block" />

            <div className="flex items-center gap-2">
              {/* View Switcher Controls Container */}
              <div className="flex items-center p-0.5 bg-muted/30 border border-border/30 rounded-lg mr-2 hidden md:flex">
                <button
                  onClick={() => setViewMode('daily')}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-black rounded-md transition-all",
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
                    "px-2.5 py-1 text-[10px] font-black rounded-md transition-all",
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
        </div>

        {/* Calendar Content - responsive min-width based on container */}
        <div className="flex-1 min-h-0 overflow-auto relative">
          <div className="min-w-[400px] h-full flex flex-col">
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
