'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { DashboardDisplayMode } from '@/lib/dashboard/display-mode'
import { useDashboardDisplay } from '@/hooks/use-dashboard-display'
import { useDashboardDisplayStore, type WidgetSurfaceStyle } from '@/store/dashboard-display-store'
import {
  CircleDollarSign,
  EyeOff,
  Percent,
  ScanEye,
  Target,
  LayoutGrid,
  Layers,
} from 'lucide-react'

const ICONS: Record<DashboardDisplayMode, typeof CircleDollarSign> = {
  dollars: CircleDollarSign,
  percentage: Percent,
  privacy: EyeOff,
  rMultiple: Target,
}

export function DashboardDisplayModeSelector({
  mobile = false,
}: {
  mobile?: boolean
}) {
  const { mode, setMode, allModes } = useDashboardDisplay()
  const widgetStyle = useDashboardDisplayStore((s) => s.widgetStyle)
  const setWidgetStyle = useDashboardDisplayStore((s) => s.setWidgetStyle)

  const ActiveIcon = ICONS[mode]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 text-muted-foreground hover:bg-muted/40 hover:text-foreground',
            mobile && 'h-9 w-9'
          )}
          title={allModes[mode].label}
        >
          <ActiveIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        {(Object.keys(allModes) as DashboardDisplayMode[]).map((value) => {
          const Icon = ICONS[value]
          const isActive = value === mode

          return (
            <DropdownMenuItem
              key={value}
              className="flex items-start gap-3 py-2"
              onClick={() => setMode(value)}
            >
              <div
                className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                  isActive ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border/50 bg-muted/30 text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{allModes[value].label}</span>
                  {isActive && <ScanEye className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{allModes[value].description}</p>
              </div>
            </DropdownMenuItem>
          )
        })}
        <div className="h-px bg-border/50 my-2" />
        <div className="px-2 py-1.5 mb-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Widget Style
          </p>
        </div>
        <DropdownMenuItem
          className="flex items-start gap-3 py-2"
          onClick={() => setWidgetStyle('default')}
        >
          <div
            className={cn(
              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
              widgetStyle === 'default' ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border/50 bg-muted/30 text-muted-foreground'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Standard</span>
              {widgetStyle === 'default' && <ScanEye className="h-3.5 w-3.5 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground">Original muted panel styling</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex items-start gap-3 py-2"
          onClick={() => setWidgetStyle('glass')}
        >
          <div
            className={cn(
              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
              widgetStyle === 'glass' ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border/50 bg-muted/30 text-muted-foreground'
            )}
          >
            <Layers className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Glassmorphism</span>
              {widgetStyle === 'glass' && <ScanEye className="h-3.5 w-3.5 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground">Modern card style with borders</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
