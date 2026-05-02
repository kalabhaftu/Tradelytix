"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { WidgetCard } from "../widget-card"
import { useData } from "@/context/data-provider"
import { getTradeNetPnl } from "@/lib/metrics/pnl"

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function formatHour(h: number): string {
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

function getColor(pnl: number, maxAbs: number): string {
  if (maxAbs === 0) return 'bg-muted/20'
  const intensity = Math.min(Math.abs(pnl) / maxAbs, 1)
  if (pnl > 0) {
    if (intensity > 0.75) return 'bg-long'
    if (intensity > 0.5) return 'bg-long/70'
    if (intensity > 0.25) return 'bg-long/40'
    return 'bg-long/20'
  } else if (pnl < 0) {
    if (intensity > 0.75) return 'bg-short'
    if (intensity > 0.5) return 'bg-short/70'
    if (intensity > 0.25) return 'bg-short/40'
    return 'bg-short/20'
  }
  return 'bg-muted/20'
}

interface HeatmapCell {
  pnl: number
  count: number
}

export default function TimeHeatmap() {
  const { formattedTrades } = useData()

  const heatmapData = React.useMemo(() => {
    const grid: Record<string, Record<number, HeatmapCell>> = {}
    DAYS.forEach(d => {
      grid[d] = {}
      HOURS.forEach(h => { grid[d][h] = { pnl: 0, count: 0 } })
    })

    for (const trade of (formattedTrades || [])) {
      if (!trade.entryDate) continue
      const date = new Date(trade.entryDate)
      const dayNum = date.getDay() // 0=Sun, 1=Mon...5=Fri
      if (dayNum === 0 || dayNum === 6) continue
      const dayName = DAYS[dayNum - 1]
      const hour = date.getHours()
      const pnl = getTradeNetPnl(trade)
      grid[dayName][hour].pnl += pnl
      grid[dayName][hour].count += 1
    }

    return grid
  }, [formattedTrades])

  const maxAbs = React.useMemo(() => {
    let max = 0
    DAYS.forEach(d => HOURS.forEach(h => {
      const abs = Math.abs(heatmapData[d][h].pnl)
      if (abs > max) max = abs
    }))
    return max
  }, [heatmapData])

  const activeHours = React.useMemo(() => {
    return HOURS.filter(h => DAYS.some(d => heatmapData[d][h].count > 0))
  }, [heatmapData])

  if (activeHours.length === 0) {
    return (
      <WidgetCard title="Time-of-Day Heatmap">
        <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm">
          No trade data available
        </div>
      </WidgetCard>
    )
  }

  return (
    <WidgetCard title="Time-of-Day Heatmap">
      <div className="flex flex-col h-full gap-2 overflow-auto">
        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest shrink-0">
          Avg P&L by day × hour — green = profit, red = loss
        </p>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Hour labels row */}
            <div className="flex gap-px mb-1">
              <div className="w-8 shrink-0" />
              {activeHours.map(h => (
                <div key={h} className="w-6 text-center">
                  <span className="text-[7px] text-muted-foreground/40 font-bold">
                    {h % 4 === 0 ? formatHour(h) : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Day rows */}
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-px mb-px">
                <div className="w-8 shrink-0">
                  <span className="text-[9px] font-bold text-muted-foreground/50">{day}</span>
                </div>
                {activeHours.map(h => {
                  const cell = heatmapData[day][h]
                  const color = getColor(cell.pnl, maxAbs)
                  const avgPnl = cell.count > 0 ? cell.pnl / cell.count : 0
                  return (
                    <div
                      key={h}
                      title={cell.count > 0 ? `${day} ${formatHour(h)}: ${cell.count} trade${cell.count !== 1 ? 's' : ''}, avg $${avgPnl.toFixed(0)}` : ''}
                      className={cn(
                        "w-6 h-5 rounded-sm transition-opacity cursor-default",
                        cell.count > 0 ? color : 'bg-muted/10'
                      )}
                    />
                  )
                })}
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 pl-8">
              <div className="flex items-center gap-1">
                <div className="w-4 h-3 rounded-sm bg-short" />
                <span className="text-[8px] text-muted-foreground/50 font-bold">Loss</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-3 rounded-sm bg-muted/20" />
                <span className="text-[8px] text-muted-foreground/50 font-bold">None</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-3 rounded-sm bg-long" />
                <span className="text-[8px] text-muted-foreground/50 font-bold">Profit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  )
}
