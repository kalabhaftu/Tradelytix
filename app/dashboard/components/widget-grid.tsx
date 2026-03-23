'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Responsive, verticalCompactor } from 'react-grid-layout'

function useGridContainerWidth() {
  const [width, setWidth] = useState(0)
  const [mounted, setMounted] = useState(false)
  const lastWidthRef = useRef(0)
  const observerRef = useRef<ResizeObserver | null>(null)
  const timersRef = useRef<NodeJS.Timeout[]>([])

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous observer and timers
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    if (!node) return

    const measure = () => {
      const w = node.offsetWidth
      if (w > 0 && w !== lastWidthRef.current) {
        lastWidthRef.current = w
        setWidth(w)
      }
      if (w > 0 && !mounted) setMounted(true)
    }

    // Immediate measurement
    requestAnimationFrame(measure)

    // Setup new observer
    observerRef.current = new ResizeObserver(() => {
      requestAnimationFrame(measure)
    })
    observerRef.current.observe(node)

    // Setup delayed passes for transitions
    timersRef.current = [300, 600, 1200].map((delay) =>
      setTimeout(() => {
        requestAnimationFrame(() => {
          measure()
          window.dispatchEvent(new Event('resize'))
        })
      }, delay)
    )
  }, [mounted])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect()
      timersRef.current.forEach(clearTimeout)
    }
  }, [])

  return { width, containerRef, mounted }
}
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Plus, GripVertical } from 'lucide-react'
import { WIDGET_REGISTRY } from '../config/widget-registry-lazy'
import { useTemplateEditStore } from '@/store/template-edit-store'
import { useTemplates } from '@/context/template-provider'
import { useData } from '@/context/data-provider'
import { useAccounts } from '@/hooks/use-accounts'
import { cn } from '@/lib/utils'
import type { WidgetLayout } from '@/server/dashboard-templates'
import type { WidgetType } from '../types/dashboard'
import WidgetLibraryDialog from './widget-library-dialog'
import KpiWidgetSelector from './kpi-widget-selector'
import { EmptyAccountState } from './empty-account-state'
import { MainDashboardSkeleton } from '@/components/ui/dashboard-skeleton'
import { WIDGET_GRID_DEFAULTS } from '../config/widget-dimensions'
import { toast } from 'sonner'

import 'react-grid-layout/css/styles.css'

const GRID_COLS = 12
const ROW_HEIGHT = 80
const GRID_MARGIN: [number, number] = [12, 12]

const generateWidgetId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `widget-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const isKpiRowWidget = (widget: WidgetLayout) => widget.y === 0 && widget.h === 1

interface WidgetGridProps {
  className?: string
}

export default function WidgetGrid({ className }: WidgetGridProps) {
  const { isEditMode, currentLayout, updateLayout } = useTemplateEditStore()
  const { activeTemplate, isLoading } = useTemplates()
  const { accountNumbers, formattedTrades, isLoadingAccountFilterSettings, accountFilterSettings } = useData()
  const { accounts } = useAccounts()
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false)
  const [showKpiSelector, setShowKpiSelector] = useState(false)
  const { width: containerWidth, containerRef: gridContainerRef, mounted: gridMounted } = useGridContainerWidth()
  const [targetSlot, setTargetSlot] = useState<{
    slotIndex?: number
    x?: number
    y?: number
  } | null>(null)

  // Ref to prevent layout save loops
  const isInternalUpdate = useRef(false)

  // Clear targetSlot when dialogs close
  useEffect(() => {
    if (!showWidgetLibrary && !showKpiSelector) {
      setTargetSlot(null)
    }
  }, [showWidgetLibrary, showKpiSelector])

  // Use current layout if in edit mode, otherwise use active template
  const layout = isEditMode && currentLayout ? currentLayout : activeTemplate?.layout || []

  // Separate KPI widgets from other widgets
  const kpiWidgets = useMemo(() => {
    return layout
      .filter(isKpiRowWidget)
      .sort((a, b) => a.x - b.x)
      .slice(0, 5)
  }, [layout])

  // Fill KPI slots (always 5)
  const kpiLayout = useMemo(() => {
    return Array(5).fill(null).map((_, index) => {
      return kpiWidgets.find(w => w.x === index) || null
    }) as (WidgetLayout | null)[]
  }, [kpiWidgets])

  // Non-KPI widgets — these go in the react-grid-layout
  const gridWidgets = useMemo(() => {
    return layout.filter(w => !isKpiRowWidget(w))
  }, [layout])

  // Convert our WidgetLayout[] to react-grid-layout's Layout[]
  const gridLayouts = useMemo(() => {
    const desktopLayout = gridWidgets.map(w => {
      const defaults = WIDGET_GRID_DEFAULTS[w.type as WidgetType] || WIDGET_GRID_DEFAULTS.default
      return {
        i: w.i,
        x: w.x,
        y: w.y - 1, // Shift down by 1 since KPI row is separate
        w: w.w,
        h: w.h,
        minW: defaults.minW,
        minH: defaults.minH,
        static: !isEditMode,
      }
    })

    return {
      xl: desktopLayout,
      lg: desktopLayout,
      md: desktopLayout.map(l => ({
        ...l,
        // On tablets: 2-column layout instead of single column
        w: Math.min(l.w, 6),
        x: l.x >= 6 ? 0 : l.x,
      })),
      sm: desktopLayout.map(l => ({ 
        ...l, 
        w: 1, 
        minW: 1, 
        x: 0,
        // On mobile, enforce minH to ensure contents (like the mini calendar) don't get crushed vertically
        h: Math.max(l.h, l.minH || 4) 
      })), // Stack strictly on mobile
    }
  }, [gridWidgets, isEditMode])

  // Handle layout change from react-grid-layout
  const handleLayoutChange = useCallback((newLayout: any[], allLayouts: Record<string, any[]>) => {
    if (!isEditMode || isInternalUpdate.current) return

    // Get the current breakpoint layout
    const updatedGridWidgets: WidgetLayout[] = newLayout.map(item => {
      const original = gridWidgets.find(w => w.i === item.i)
      return {
        i: item.i,
        type: original?.type || '',
        size: original?.size || 'medium',
        x: item.x,
        y: item.y + 1, // Shift back up for KPI row offset
        w: item.w,
        h: item.h,
      }
    })

    // Combine with KPI widgets
    const fullLayout = [...kpiWidgets, ...updatedGridWidgets]
    updateLayout(fullLayout)
  }, [isEditMode, gridWidgets, kpiWidgets, updateLayout])

  // Handle widget removal
  const handleRemoveWidget = useCallback((widgetId: string) => {
    if (!currentLayout) return
    const updatedLayout = currentLayout.filter(w => w.i !== widgetId)
    updateLayout(updatedLayout)
  }, [currentLayout, updateLayout])

  // Handle add widget
  const handleAddWidget = useCallback((slotInfo?: { slotIndex?: number; x?: number; y?: number }) => {
    setTargetSlot(slotInfo || null)
    if (slotInfo?.slotIndex !== undefined && slotInfo.slotIndex < 5) {
      setShowKpiSelector(true)
    } else {
      setShowWidgetLibrary(true)
    }
  }, [])

  // Handle widget insertion from library
  const handleInsertWidget = useCallback((widgetType: string) => {
    if (!currentLayout) return

    const config = WIDGET_REGISTRY[widgetType as keyof typeof WIDGET_REGISTRY]
    if (!config) return

    const slotToUse = targetSlot
    const defaults = WIDGET_GRID_DEFAULTS[widgetType as WidgetType] || WIDGET_GRID_DEFAULTS.default

    let x = 0, y = 1, w = defaults.defaultW, h = defaults.defaultH

    if (config.kpiRowOnly && slotToUse?.slotIndex !== undefined) {
      x = slotToUse.slotIndex
      y = 0
      w = 1
      h = 1
    } else if (slotToUse?.x !== undefined && slotToUse?.y !== undefined) {
      x = slotToUse.x
      y = slotToUse.y
    } else {
      // Place at the bottom
      const maxY = currentLayout.reduce((max, widget) => {
        if (isKpiRowWidget(widget)) return max
        return Math.max(max, widget.y + widget.h)
      }, 1)
      y = maxY
      x = 0
    }

    const newWidget: WidgetLayout = {
      i: generateWidgetId(),
      type: widgetType,
      size: config.defaultSize,
      x,
      y,
      w,
      h,
    }

    isInternalUpdate.current = true
    updateLayout([...currentLayout, newWidget])
    setTargetSlot(null)
    setTimeout(() => {
      isInternalUpdate.current = false
      toast.success('Widget added successfully', { duration: 2000 })
    }, 0)
  }, [currentLayout, targetSlot, updateLayout])

  // Handle KPI widget selection
  const handleSelectKpiWidget = useCallback((widgetType: string) => {
    handleInsertWidget(widgetType)
  }, [handleInsertWidget])

  // Handle KPI drag reorder
  const handleKpiDragEnd = useCallback((dragIndex: number, dropIndex: number) => {
    if (!currentLayout || dragIndex === dropIndex) return

    const reorderedKpi = [...kpiWidgets]
    const [moved] = reorderedKpi.splice(dragIndex, 1)
    reorderedKpi.splice(dropIndex, 0, moved)

    const updatedKpi = reorderedKpi.map((widget, index) => ({
      ...widget,
      x: index,
    }))

    const otherWidgets = currentLayout.filter(w => !isKpiRowWidget(w))
    updateLayout([...updatedKpi, ...otherWidgets])
  }, [currentLayout, kpiWidgets, updateLayout])

  // Show empty state
  const showEmptyState = !isEditMode &&
    !isLoading &&
    accountNumbers.length === 0 &&
    (!accountFilterSettings?.selectedPhaseAccountIds || accountFilterSettings.selectedPhaseAccountIds.length === 0) &&
    accounts && accounts.length > 0

  if (isLoading || !activeTemplate) {
    return <MainDashboardSkeleton />
  }

  if (showEmptyState) {
    return <EmptyAccountState />
  }

  // Whether the grid has finished its initial width measurement
  const gridReady = gridMounted && containerWidth > 0

  return (
    <div className={cn('space-y-3', className)}>
      {/* KPI Row — Responsive grid: stacked on mobile, 5-col on desktop */}
      <div className="px-3 sm:px-4 pt-3 sm:pt-4">
        <div
          className={cn(
            'relative',
            isEditMode && 'border-2 border-dashed border-border/50 rounded-xl p-2'
          )}
        >
          {/* Mobile: 2-col grid that stacks, Tablet: 3-col, Desktop: 5-col */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {kpiLayout.map((widget, index) => (
              <div key={`kpi-slot-${index}`} className="relative">
                {widget ? (
                  <div className="relative group h-full">
                    {/* Edit mode controls */}
                    {isEditMode && (
                      <>
                        <div className="absolute top-2 left-2 cursor-move z-10 bg-background/80 backdrop-blur-sm rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 rounded-full p-0 shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveWidget(widget.i)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {WIDGET_REGISTRY[widget.type as WidgetType]?.getComponent({ size: 'kpi' as any })}
                  </div>
                ) : (
                  isEditMode && (
                    <Card
                      className="h-24 border-2 border-dashed border-border/50 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all hover:border-primary/30"
                      onClick={() => handleAddWidget({ slotIndex: index })}
                    >
                      <CardContent className="h-full flex flex-col items-center justify-center p-4">
                        <Plus className="h-5 w-5 text-muted-foreground mb-1.5" />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                          Add KPI
                        </span>
                      </CardContent>
                    </Card>
                  )
              )}
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Main Grid — react-grid-layout */}
      {/* The ref div MUST always be in the DOM so ResizeObserver can measure width */}
      <div className="px-2" ref={gridContainerRef}>
        {gridReady ? (
        <Responsive
          width={containerWidth}
          layouts={gridLayouts}
          breakpoints={{ xl: 1280, lg: 1024, md: 768, sm: 480 }}
          cols={{ xl: GRID_COLS, lg: GRID_COLS, md: 6, sm: 1 }}
          rowHeight={ROW_HEIGHT}
          margin={GRID_MARGIN}
          containerPadding={[8, 8]}
          dragConfig={{ enabled: isEditMode, handle: '.widget-drag-handle' }}
          resizeConfig={{ enabled: isEditMode, handles: ['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne'] }}
          compactor={verticalCompactor}
          onLayoutChange={handleLayoutChange as any}
        >
          {gridWidgets.map(widget => {
            const config = WIDGET_REGISTRY[widget.type as WidgetType]
            if (!config) return null

            return (
              <div key={widget.i} className={cn("group", isEditMode && "ring-1 ring-border/30 ring-inset rounded-2xl hover:ring-primary/40 transition-all")}>
                <div className="relative h-full w-full">
                  {/* Edit mode overlay controls */}
                  {isEditMode && (
                    <>
                      <div className="widget-drag-handle absolute top-2 left-2 cursor-grab active:cursor-grabbing z-10 bg-background/80 backdrop-blur-sm rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-border/50">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full p-0 shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveWidget(widget.i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {/* Resize hint indicator - bottom right */}
                      <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 border border-border/50 shadow-sm">
                          <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                          </svg>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Resize</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Widget content */}
                  <div className="h-full w-full overflow-hidden">
                    {config.getComponent({ size: widget.size as any })}
                  </div>
                </div>
              </div>
            )
          })}
        </Responsive>
        ) : (
          <MainDashboardSkeleton />
        )}
      </div>

      {/* Add new widget button at bottom in edit mode */}
      {isEditMode && (
        <div className="px-4 pb-4">
          <Card
            className="h-24 border-2 border-dashed border-border/50 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all hover:border-primary/30"
            onClick={() => handleAddWidget()}
          >
            <CardContent className="h-full flex flex-col items-center justify-center p-4">
              <Plus className="h-6 w-6 text-muted-foreground mb-1.5" />
              <span className="text-xs font-bold text-muted-foreground">
                Add Widget
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Widget Library Dialog */}
      <WidgetLibraryDialog
        open={showWidgetLibrary}
        onOpenChange={setShowWidgetLibrary}
        currentLayout={currentLayout || []}
        onInsertWidget={handleInsertWidget}
      />

      {/* KPI Widget Selector */}
      <KpiWidgetSelector
        open={showKpiSelector}
        onOpenChange={setShowKpiSelector}
        currentLayout={currentLayout || []}
        onSelectWidget={handleSelectKpiWidget}
      />
    </div>
  )
}
