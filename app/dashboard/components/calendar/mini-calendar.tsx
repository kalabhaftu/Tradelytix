'use client'

import React, { useState, useMemo, useCallback, useRef } from "react"
import { format, addMonths, subMonths, isSameMonth } from "date-fns"
import { ChevronLeft, ChevronRight, Camera } from "lucide-react"
import html2canvas from 'html2canvas'
import { toast } from "sonner"
import { WidgetCard } from '../widget-card'
import { Button } from "@/components/ui/button"
import { CalendarData } from "@/app/dashboard/types/calendar"
import { useData } from "@/context/data-provider"
import MonthlyView from "./monthly-view"
import { BREAK_EVEN_THRESHOLD } from "@/lib/utils"
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

  // Modals state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date | null>(null)

  const calendarRef = useRef<HTMLDivElement>(null)

  const handleScreenshot = useCallback(async () => {
    if (!calendarRef.current) return

    try {
      toast.info("Capturing screenshot...")
      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        windowWidth: 600,
        onclone: (clonedDoc) => {
          const wrapper = clonedDoc.getElementById('mini-calendar-capture')
          if (wrapper) {
            wrapper.style.padding = '50px 60px 70px 60px'
            wrapper.style.background = 'linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #0a0812 100%)'
            wrapper.style.borderRadius = '0px'
            wrapper.style.display = 'flex'
            wrapper.style.flexDirection = 'column'
            wrapper.style.alignItems = 'center'
            wrapper.style.justifyContent = 'center'
            wrapper.style.width = '800px'
            wrapper.style.height = 'fit-content'

            const card = wrapper.querySelector('[data-widget-card]') as HTMLElement || wrapper.querySelector('.rounded-2xl') as HTMLElement
            if (card) {
              card.style.width = '100%'
              card.style.maxWidth = '680px'
              card.style.boxShadow = '0 30px 60px -12px rgba(0,0,0,0.7), 0 0 100px -20px rgba(48,43,99,0.5)'
              card.style.border = '1px solid hsl(var(--border)/0.5)'
              card.style.background = 'hsl(var(--background))'
              card.style.height = 'auto'
              card.style.minHeight = '400px'
              card.style.borderRadius = '16px'
            }

            const watermark = clonedDoc.getElementById('mini-calendar-watermark')
            if (watermark) {
              watermark.style.display = 'flex'
              watermark.style.marginTop = '40px'
              const svg = watermark.querySelector('svg')
              if (svg) svg.style.fill = '#ffffff'
            }
          }
        }
      })
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to capture screenshot")
          return
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `mini-calendar-${format(currentDate, 'yyyy-MM-dd')}.png`
        link.click()
        URL.revokeObjectURL(url)
        toast.success("Screenshot saved!")
      }, 'image/png')
    } catch (error) {
      toast.error("Failed to capture screenshot")
    }
  }, [currentDate])

  // Navigation
  const handlePrev = useCallback(() => setCurrentDate(prev => subMonths(prev, 1)), [])
  const handleNext = useCallback(() => setCurrentDate(prev => addMonths(prev, 1)), [])

  // Stats
  const displayTotal = useMemo(() => {
    let total = 0
    const currentMonthPrefix = format(currentDate, 'yyyy-MM')
    Object.entries(calendarData).forEach(([key, data]) => {
      if (key.startsWith(currentMonthPrefix)) {
        total += data.pnl
      }
    })
    return total
  }, [calendarData, currentDate])

  const isPositive = displayTotal >= 0

  const tradedDaysCount = useMemo(() => {
    let count = 0;
    const currentMonthPrefix = format(currentDate, 'yyyy-MM')
    Object.entries(calendarData).forEach(([key, data]) => {
      if (key.startsWith(currentMonthPrefix) && data.tradeNumber > 0) count++
    })
    return count;
  }, [calendarData, currentDate])

  return (
    <div id="mini-calendar-capture" ref={calendarRef} className="w-full h-full">
      <WidgetCard noPadding data-widget-card="true" className="overflow-hidden flex flex-col h-full bg-background relative z-10">
        {/* Unified Header: Navigation + Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 px-4 py-3 border-b border-border/20 bg-muted/5 flex-shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Navigation Group */}
            <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5 border border-border/30 font-bold shrink-0">
              <Button variant="ghost" size="icon" onClick={handlePrev} className="h-6 w-6 hover:bg-background" aria-label="Previous month">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <div className="px-2 min-w-[90px] text-center">
                <span className="text-[11px] font-black capitalize tracking-tight">
                  {format(currentDate, 'MMM yyyy')}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleNext} className="h-6 w-6 hover:bg-background" aria-label="Next month">
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

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-[10px] font-bold text-muted-foreground mr-1 hidden lg:inline">
              Monthly stats:
            </span>

            {/* Stats Badges */}
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
              <div className={
                "px-1.5 py-0.5 rounded border shadow-sm flex items-center " +
                (isPositive ? "bg-long/10 border-long/20 text-long" : "bg-short/10 border-short/20 text-short")
              }>
                {formatCompact(displayTotal)}
              </div>
              <div className="px-1.5 py-0.5 rounded bg-chart-4/10 border border-chart-4/20 text-chart-4 border-solid shadow-sm">
                {tradedDaysCount} d
              </div>
            </div>

            <div className="w-px h-3 bg-border/40 mx-1" />

            <Button
              className="h-7 px-2.5 text-[10px] font-bold gap-1 bg-muted/20 hover:bg-primary/5 hover:text-primary transition-all rounded-md"
              variant="ghost"
              size="sm"
              onClick={handleScreenshot}
            >
              <Camera className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Snapshot</span>
            </Button>
          </div>
        </div>

        {/* Calendar Grid - uses MonthlyView */}
        <div className="flex-1 min-h-0 overflow-y-auto relative">
          <MonthlyView
            hideWeekends
            currentDate={currentDate}
            calendarData={calendarData}
            isMiniCalendar={true}
          />
        </div>

        {/* Footer with Logo - visible branding */}
        <div className="flex items-center justify-center gap-2 py-2 px-3 border-t border-border/20 bg-muted/5 flex-shrink-0">
          <Logo className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            Deltalytix
          </span>
        </div>
      </WidgetCard>
      
      {/* Hidden watermark/logo for screenshots */}
      <div id="mini-calendar-watermark" className="hidden flex-col items-center justify-center pb-6 gap-2">
        <div className="flex items-center gap-3">
          <Logo className="w-7 h-7" />
          <span className="text-base font-black uppercase tracking-[0.25em] text-white watermark-text">Deltalytix</span>
        </div>
        <span className="text-[9px] font-medium uppercase tracking-widest text-white/60">Trading Performance Analytics</span>
      </div>
    </div>
  )
}

export default React.memo(MiniCalendar, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.calendarData) === JSON.stringify(nextProps.calendarData)
})
