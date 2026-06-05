'use client'

import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react"
import { format, addMonths, subMonths, getYear } from "date-fns"
import { enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Camera, ImageIcon, Sparkles, Info } from "lucide-react"
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
import { useUserStore } from "@/store/user-store"
import { useWidgetData } from "@/hooks/use-widget-data"
import { CalendarData } from "@/app/dashboard/types/calendar"
import { WidgetCard } from "../widget-card"
import {
  type CalendarGradientPresetId,
  CALENDAR_GRADIENT_PRESETS,
  clipCalendarCardSurface,
  drawCalendarGradientBackground,
  resolveCalendarGradientPreset,
} from "./screenshot-gradients"

// New Components
import MonthlyView from "./monthly-view"
import YearlyView from "./yearly-view"
import { Logo } from "@/components/logo"

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${value.toFixed(0)}`
}

const formatFullCurrency = (value: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  })
  return formatter.format(value)
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

  // View Store
  const { viewMode, setViewMode, selectedDate, setSelectedDate, selectedWeekDate, setSelectedWeekDate } = useCalendarViewStore()
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)

  // Construct Calendar Data entirely from the server 
  const localCalendarData = useMemo(() => {
    return (serverCalendarData as CalendarData) || {}
  }, [serverCalendarData])


  const handleScreenshot = useCallback(async (variant: 'basic' | 'random' | CalendarGradientPresetId) => {
    if (!calendarRef.current) return

    try {
      toast.info("Capturing screenshot...")

      const rect = calendarRef.current.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const scale = Math.max(dpr, 2)

      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
      const resolvedBg = bgColor ? `hsl(${bgColor})` : '#0d0d0d'

      // Capture just the card
      const cardCanvas = await html2canvas(calendarRef.current, {
        backgroundColor: resolvedBg,
        scale,
        logging: false,
        useCORS: true,
        windowWidth: Math.round(rect.width),
        onclone: (_clonedDoc, clonedElem) => {
          clonedElem.style.width = `${rect.width}px`
          clonedElem.style.height = 'auto'
          
          const innerCard = clonedElem.querySelector('[data-widget-card="true"]') as HTMLElement
          if (innerCard) {
            innerCard.style.height = 'auto'
          }

          // Show the logo bar
          const logoBar = clonedElem.querySelector('.screenshot-logo-bar') as HTMLElement
          if (logoBar) {
            logoBar.style.display = 'flex'
          }

          clonedElem.querySelectorAll('.screenshot-btn').forEach((el) => {
            (el as HTMLElement).style.display = 'none'
          })
        },
      })

      const cardW = cardCanvas.width
      const cardH = cardCanvas.height
      const withGradient = variant !== 'basic'
      const selectedGradient = withGradient ? resolveCalendarGradientPreset(variant) : null
      const padding = withGradient ? Math.round(32 * scale) : 0
      const totalW = cardW + padding * 2
      const totalH = cardH + padding * 2

      const out = document.createElement('canvas')
      out.width = totalW
      out.height = totalH
      const ctx = out.getContext('2d')!

      if (withGradient && selectedGradient) {
        drawCalendarGradientBackground(ctx, selectedGradient.id, totalW, totalH)

        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.6)'
        ctx.shadowBlur = 50 * scale
        ctx.shadowOffsetY = 15 * scale
        const r = 20 * scale
        clipCalendarCardSurface(ctx, padding, padding, cardW, cardH, r, resolvedBg)
        // Draw the card content
        ctx.drawImage(cardCanvas, padding, padding)
        ctx.restore()
      }

      const finalCanvas = withGradient ? out : cardCanvas

      finalCanvas.toBlob((blob) => {
        if (!blob) { toast.error("Failed to capture screenshot"); return }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `calendar-${format(currentDate, 'yyyy-MM')}${selectedGradient ? `-${selectedGradient.id}` : ''}.png`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("Screenshot saved!")
      }, 'image/png')
    } catch (err) {
      console.error(err)
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
    <div className="flex items-center gap-1 max-[420px]:gap-0.5">
      {/* Snapshot dropdown — icon only, hidden in screenshot output */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="screenshot-btn h-6 w-6 max-[420px]:h-5 max-[420px]:w-5 sm:h-7 sm:w-7 hover:bg-primary/5 hover:text-primary transition-all bg-muted/20 border border-border/30 rounded-lg"
          >
            <Camera className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => handleScreenshot('basic')} className="gap-2 text-xs font-medium">
            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
            Basic (No Gradient)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleScreenshot('random')} className="gap-2 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
            Random Gradient
          </DropdownMenuItem>
          <div className="h-px bg-border/40 my-1" />
          <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            Premium Gradients
          </div>
          {CALENDAR_GRADIENT_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => handleScreenshot(preset.id)}
              className="gap-2 text-xs font-medium"
            >
              <div className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0",
                preset.id === 'midnight-prism' && "bg-gradient-to-tr from-purple-600 to-indigo-600",
                preset.id === 'aurora-glass' && "bg-gradient-to-tr from-emerald-600 to-teal-600",
                preset.id === 'ocean-glow' && "bg-gradient-to-tr from-blue-600 to-cyan-500",
                preset.id === 'sunset-bloom' && "bg-gradient-to-tr from-purple-700 to-orange-500"
              )} />
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings gear */}
      <CalendarSettings />
    </div>
  )

  const mobileInlineControls = (
    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
      <div
        className={cn(
          "flex h-6 shrink-0 items-center rounded-full border px-2 text-[10px] font-bold shadow-sm",
          isPositive 
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" 
            : "border-rose-500/20 bg-rose-500/10 text-rose-400"
        )}
      >
        {formatFullCurrency(displayTotal)}
      </div>
      <div className="flex h-6 shrink-0 items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 text-[10px] font-bold text-indigo-300 shadow-sm">
        {tradedDaysCount}d
      </div>
      {headerControls}
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
        <div className="border-b border-border/20 bg-muted/5 px-3 py-2.5 flex-shrink-0">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 max-[420px]:gap-0.5">
            {/* Left side: Navigation Group */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex items-center bg-muted/20 border border-border/30 rounded-lg overflow-hidden p-0.5 shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handlePrev} 
                  className="h-6 w-6 hover:bg-background border-none" 
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentDate(new Date())}
                  className="h-6 px-2.5 text-[10px] font-black tracking-wider uppercase border-none hover:bg-background"
                >
                  TODAY
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleNext} 
                  className="h-6 w-6 hover:bg-background border-none" 
                  aria-label="Next"
                >
                  <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
              </div>
              
              <span className="text-sm font-semibold text-foreground/90 ml-1.5 whitespace-nowrap">
                {viewMode === 'daily'
                  ? format(currentDate, 'MMMM yyyy')
                  : format(currentDate, 'yyyy')
                }
              </span>
            </div>

            <div className="lg:hidden">
              {mobileInlineControls}
            </div>

            {/* Right side: Stats + View switcher + Controls */}
            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              {/* View Switcher — hide on small screens */}
              <div className="hidden md:flex items-center p-0.5 bg-muted/20 border border-border/30 rounded-lg shrink-0">
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

              {/* Monthly stats container */}
              <div className="flex items-center gap-2 bg-[#0c0e12]/60 border border-border/20 rounded-xl px-3 py-1 text-[11px] font-bold shadow-md">
                <span className="text-muted-foreground/75 font-semibold">
                  {viewMode === 'daily' ? 'Monthly stats:' : 'Yearly stats:'}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full font-extrabold text-xs shadow-inner",
                  isPositive ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                )}>
                  {formatFullCurrency(displayTotal)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 font-extrabold text-xs shadow-inner">
                  {tradedDaysCount} {tradedDaysCount === 1 ? 'day' : 'days'}
                </span>
                
                <div className="w-px h-3.5 bg-border/30 mx-1" />
                
                <div className="flex items-center gap-1.5">
                  <CalendarSettings />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 hover:bg-primary/5 hover:text-primary transition-all rounded-md"
                    onClick={() => toast.info("Advanced calendar displays trades, R-Multiple, and Winrate.")}
                    title="Calendar Information"
                  >
                    <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-foreground" />
                  </Button>
                </div>
              </div>

              {/* Camera icon button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="screenshot-btn h-7 w-7 hover:bg-primary/5 hover:text-primary transition-all bg-muted/20 border border-border/30 rounded-lg"
                    title="Capture Screenshot"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => handleScreenshot('basic')} className="gap-2 text-xs font-medium">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Basic (No Gradient)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleScreenshot('random')} className="gap-2 text-xs font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                    Random Gradient
                  </DropdownMenuItem>
                  <div className="h-px bg-border/40 my-1" />
                  <div className="px-2 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Premium Gradients
                  </div>
                  {CALENDAR_GRADIENT_PRESETS.map((preset) => (
                    <DropdownMenuItem
                      key={preset.id}
                      onClick={() => handleScreenshot(preset.id)}
                      className="gap-2 text-xs font-medium"
                    >
                      <div className={cn(
                        "h-2.5 w-2.5 rounded-full shrink-0",
                        preset.id === 'midnight-prism' && "bg-gradient-to-tr from-purple-600 to-indigo-600",
                        preset.id === 'aurora-glass' && "bg-gradient-to-tr from-emerald-600 to-teal-600",
                        preset.id === 'ocean-glow' && "bg-gradient-to-tr from-blue-600 to-cyan-500",
                        preset.id === 'sunset-bloom' && "bg-gradient-to-tr from-purple-700 to-orange-500"
                      )} />
                      {preset.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Calendar Content - fully responsive, fills available space */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
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

        <CalendarModal
          isOpen={selectedDate !== null}
          onOpenChange={(open) => !open && setSelectedDate(null)}
          selectedDate={selectedDate}
          dayData={selectedDate ? localCalendarData[format(selectedDate, 'yyyy-MM-dd')] : undefined}
          isLoading={isLoading}
        />

        {/* Logo Footer - only shown in screenshots, hidden in live view */}
        <div className="screenshot-logo-bar hidden border-t border-border/10 bg-muted/5 py-4 flex items-center justify-center gap-2 flex-shrink-0">
          <Logo className="h-4 w-4 text-foreground/70" transparent />
          <span className="text-[10px] font-black tracking-[0.2em] text-foreground/60">TRADELYTIX</span>
        </div>
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
