import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ColumnConfigDialog } from '@/components/ui/column-config-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LexicalEditor } from '@/components/ui/editor/lexical-editor'
import { useData } from '@/context/data-provider'
import { useFilteredTrades } from '@/hooks/use-filtered-trades'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn, formatCurrency, formatQuantity, parsePositionTime } from '@/lib/utils'
import { useTableConfigStore } from '@/store/table-config-store'
import { useUserStore } from '@/store/user-store'
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, BarChart3, Info } from 'lucide-react'
import { Trade } from '@prisma/client'
import {
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  OnChangeFn,
  Table as ReactTableInstance,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { formatInTimeZone } from 'date-fns-tz'
import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'
import { DataTableColumnHeader } from './column-header'
import TradeChartModal from './trade-chart-modal'
import { TradeTableMobileCard } from './trade-table-mobile-card'

export interface ExtendedTrade extends Omit<Trade, 'tags'> {
  tags: string[]
  trades?: ExtendedTrade[]
}

const VALID_COLUMN_IDS = [
  'tradeDate',
  'instrument',
  'direction',
  'entryPrice',
  'closePrice',
  'timeInPosition',
  'pnl',
  'commission',
  'quantity',
]

const DEFAULT_SORTING: SortingState = [{ id: 'tradeDate', desc: true }]

const normalizeSorting = (sorting?: SortingState): SortingState => {
  const filtered = (sorting ?? []).filter((item) => VALID_COLUMN_IDS.includes(item.id))
  return filtered.length > 0 ? filtered : DEFAULT_SORTING
}

const areSortingStatesEqual = (a: SortingState, b: SortingState) => {
  if (a.length !== b.length) return false
  return a.every((item, index) => {
    const other = b[index]
    return other && item.id === other.id && !!item.desc === !!other.desc
  })
}

const serializeFilters = (filters: ColumnFiltersState = []) =>
  JSON.stringify(filters.map((filter) => ({ id: filter.id, value: filter.value })))

const areFiltersEqual = (a: ColumnFiltersState = [], b: ColumnFiltersState = []) =>
  serializeFilters(a) === serializeFilters(b)

const serializeVisibility = (visibility: VisibilityState = {}) =>
  JSON.stringify(
    Object.keys(visibility)
      .sort()
      .map((key) => [key, visibility[key]])
  )

const areVisibilityEqual = (a: VisibilityState = {}, b: VisibilityState = {}) =>
  serializeVisibility(a) === serializeVisibility(b)

const mergeAccountNumbers = (current: string | null | undefined, next?: string | null) => {
  const set = new Set(
    (current ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  )
  if (next) {
    next
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .forEach((value) => set.add(value))
  }
  return Array.from(set).join(',')
}

const cloneTradeForGroup = (trade: ExtendedTrade): ExtendedTrade => ({
  ...trade,
  trades: [],
  tags: Array.isArray(trade.tags) ? [...trade.tags] : [],
})

const buildGroupedTrades = (trades: ExtendedTrade[]) => {
  const groups = new Map<string, ExtendedTrade>()

  trades.forEach((trade) => {
    const entryDate = new Date(trade.entryDate)
    const key = trade.groupId ? `${trade.groupId}` : `${trade.instrument}-${entryDate.toISOString()}`

    if (!groups.has(key)) {
      groups.set(key, {
        ...trade,
        id: trade.id,
        entryDate: entryDate.toISOString(),
        trades: [cloneTradeForGroup(trade)],
        accountNumber: trade.accountNumber ?? '',
      })
    } else {
      const group = groups.get(key)!
      if (!group.trades) group.trades = []
      group.trades.push(cloneTradeForGroup(trade))
      group.pnl += trade.pnl || 0
      group.commission += trade.commission || 0
      group.quantity += trade.quantity || 0
      if (trade.closeDate && (!group.closeDate || new Date(trade.closeDate) > new Date(group.closeDate))) {
        group.closeDate = trade.closeDate
      }
      if ((trade.timeInPosition || 0) > (group.timeInPosition || 0)) {
        group.timeInPosition = trade.timeInPosition
      }
      group.accountNumber = mergeAccountNumbers(group.accountNumber, trade.accountNumber)
    }
  })

  return Array.from(groups.values())
}

const getDecimalPlaces = (instrument: string, price: number): number => {
  const instrumentUpper = instrument?.toUpperCase?.() ?? ''
  if (
    instrumentUpper.includes('USD') ||
    instrumentUpper.includes('EUR') ||
    instrumentUpper.includes('GBP') ||
    instrumentUpper.includes('JPY') ||
    instrumentUpper.includes('AUD') ||
    instrumentUpper.includes('CAD') ||
    instrumentUpper.includes('CHF') ||
    instrumentUpper.includes('NZD')
  ) {
    return 4
  }

  if (instrumentUpper.includes('XAU') || instrumentUpper.includes('XAG')) {
    return 2
  }

  if (
    instrumentUpper.includes('US') ||
    instrumentUpper.includes('SPX') ||
    instrumentUpper.includes('NAS') ||
    instrumentUpper.includes('DOW')
  ) {
    return 2
  }

  return 2
}

type ColumnFactoryParams = {
  timezone: string
  onRowSelectionChange: (ids: string[], value: boolean) => void
  onViewDetails: (trade: ExtendedTrade) => void
  onEditTrade: (trade: Trade | ExtendedTrade) => void
  onViewChart: (trade: ExtendedTrade) => void
}

const useTradeTableColumns = ({
  timezone,
  onRowSelectionChange,
  onViewDetails,
  onEditTrade,
  onViewChart,
}: ColumnFactoryParams) => {
  return React.useMemo<ColumnDef<ExtendedTrade>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
            const allTradeIds = table.getRowModel().rows.flatMap((row) => {
              const subTradeIds = row.original.trades?.map((t) => t.id) || []
              return [row.original.id, ...subTradeIds].filter(Boolean) as string[]
            })
            onRowSelectionChange(allTradeIds, !!value)
          }}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => {
        const tradeIds = [row.original.id, ...(row.original.trades?.map((t) => t.id) || [])].filter(Boolean) as string[]
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value)
              onRowSelectionChange(tradeIds, !!value)
            }}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'expand',
      header: () => null,
      cell: ({ row }) => {
        if ((row.original.trades?.length || 0) <= 1) return null
        return (
          <Button variant="ghost" size="sm" onClick={row.getToggleExpandedHandler()} className="hover:bg-transparent">
            {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )
      },
    },
    {
      id: 'accounts',
      header: () => (
        <Button variant="ghost" size="sm" className="-ml-3 h-8">
          Total
        </Button>
      ),
      cell: ({ row }) => {
        const accounts = row.original.accountNumber
          ?.split(',')
          .map((account: string) => account.trim())
          .filter(Boolean) ?? []

        return (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <div
                  className="flex items-center justify-center min-w-6 px-2 h-6 rounded-full bg-muted text-xs font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                  title={accounts.join(', ')}
                >
                  {accounts.length <= 1
                    ? accounts[0] ?? '--'
                    : `+${accounts.length}`}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-fit p-0" align="start" side="right">
                  <ScrollArea className="h-36 rounded-md border">
                    {accounts.map((account: string) => (
                      <div key={account} className="px-3 py-2 text-sm hover:bg-muted/50 cursor-default">
                        {account}
                      </div>
                    ))}
                  </ScrollArea>
              </PopoverContent>
            </Popover>
            {(row.original.trades?.length || 0) > 1 && (
              <span className="text-xs text-muted-foreground">({row.original.trades?.length})</span>
            )}
          </div>
        )
      },
    },
    {
      id: 'tradeDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trade Date" tableId="trade-table" />
      ),
      cell: ({ row }) => {
        const date = row.original.trades?.[0]?.entryDate ?? row.original.entryDate
        return formatInTimeZone(new Date(date), timezone, 'yyyy-MM-dd')
      },
      sortingFn: (rowA, rowB) => {
        const toTimestamp = (row: typeof rowA) => {
          const first = row.original.trades?.[0]
          const date = first?.entryDate ?? row.original.entryDate
          return new Date(date).getTime()
        }
        return toTimestamp(rowA) - toTimestamp(rowB)
      },
    },
    {
      accessorKey: 'instrument',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Instr." tableId="trade-table" />,
      cell: ({ row }) => <div className="font-bold tracking-tight">{row.original.instrument}</div>,
      size: 100,
    },
    {
      accessorKey: 'direction',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Side" tableId="trade-table" className="justify-center" />,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant={row.original.side?.toUpperCase() === 'BUY' || row.original.side?.toUpperCase() === 'LONG' ? 'default' : 'destructive'} className="text-[10px] uppercase font-bold px-1.5 py-0">
            {row.original.side?.toUpperCase().slice(0, 4)}
          </Badge>
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: 'entryPrice',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Entry" tableId="trade-table" className="justify-end px-0" />,
      cell: ({ row }) => {
        const value = parseFloat(String(row.original.entryPrice))
        const decimals = getDecimalPlaces(row.original.instrument, value)
        return <div className="text-right font-mono text-xs">{formatCurrency(value, decimals)}</div>
      },
      size: 110,
    },
    {
      accessorKey: 'closePrice',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Close" tableId="trade-table" className="justify-end px-0" />,
      cell: ({ row }) => {
        const value = parseFloat(String(row.original.closePrice))
        const decimals = getDecimalPlaces(row.original.instrument, value)
        return <div className="text-right font-mono text-xs">{formatCurrency(value, decimals)}</div>
      },
      size: 110,
    },
    {
      accessorKey: 'timeInPosition',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" tableId="trade-table" className="justify-end px-0" />,
      cell: ({ row }) => <div className="text-right font-mono text-xs text-muted-foreground">{parsePositionTime(row.original.timeInPosition || 0)}</div>,
      sortingFn: (rowA, rowB) => (rowA.original.timeInPosition || 0) - (rowB.original.timeInPosition || 0),
      size: 100,
    },
    {
      accessorKey: 'pnl',
      header: ({ column }) => <DataTableColumnHeader column={column} title="PnL" tableId="trade-table" className="justify-end px-0" />,
      cell: ({ row }) => {
        const value = row.original.pnl
        return (
          <div className="text-right font-bold font-mono">
            <span className={cn(value >= 0 ? 'text-profit' : 'text-loss')}>
              {value >= 0 ? '+' : ''}{formatCurrency(value)}
            </span>
          </div>
        )
      },
      sortingFn: 'basic',
      size: 110,
    },
    {
      accessorKey: 'commission',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Comm." tableId="trade-table" className="justify-end px-0" />,
      cell: ({ row }) => <div className="text-right font-mono text-muted-foreground">{formatCurrency(row.original.commission)}</div>,
      size: 90,
    },
    {
      accessorKey: 'quantity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" tableId="trade-table" className="justify-end px-0" />,
      cell: ({ row }) => <div className="text-right font-mono font-medium">{formatQuantity(row.original.quantity)}</div>,
      sortingFn: 'basic',
      size: 80,
    },
    {
      id: 'actions',
      header: () => <div className="text-center w-full">Actions</div>,
      cell: ({ row }) => {
        const trade = row.original
        const tradeToEdit = (trade.trades?.length || 0) > 0 ? trade.trades![0] : trade

        return (
          <div className="flex items-center justify-center space-x-1.5">
            <Button variant='secondary' size='sm' className="h-7 px-2 text-[11px]" onClick={() => onViewDetails(trade)}>
              View
            </Button>
            <Button variant='ghost' size='sm' className="h-7 px-2 text-[11px]" onClick={() => onEditTrade(tradeToEdit)}>
              Edit
            </Button>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
      size: 100,
    },
  ], [timezone, onRowSelectionChange, onViewDetails, onEditTrade])
}

export function TradeTableReview() {
  const {
    updateTrades,
    accountNumbers,
    dateRange,
    instruments,
    pnlRange,
    timeRange,
    weekdayFilter,
    hourFilter,
  } = useData() as any
  const timezone = useUserStore((state) => state.timezone)
  const isMobile = useMediaQuery('(max-width: 768px)')

  const router = useRouter()
  const searchParams = useSearchParams()

  const tableConfig = useTableConfigStore((state) => state.tables['trade-table'])
  const updateSorting = useTableConfigStore((state) => state.updateSorting)
  const updateColumnFilters = useTableConfigStore((state) => state.updateColumnFilters)
  const updateColumnVisibilityState = useTableConfigStore((state) => state.updateColumnVisibilityState)
  const updatePageSize = useTableConfigStore((state) => state.updatePageSize)
  const updatePageIndex = useTableConfigStore((state) => state.updatePageIndex)

  const [sorting, setSorting] = React.useState<SortingState>(() => normalizeSorting(tableConfig?.sorting))
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(tableConfig?.columnFilters ?? [])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(tableConfig?.columnVisibility ?? {})
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [pageSize, setPageSize] = React.useState(tableConfig?.pageSize ?? 10)
  const [pageIndex, setPageIndex] = React.useState(tableConfig?.pageIndex ?? 0)
  const [selectedTrades, setSelectedTrades] = React.useState<string[]>([])
  const [isChartModalOpen, setIsChartModalOpen] = React.useState(false)
  const [selectedTradeForChart, setSelectedTradeForChart] = React.useState<ExtendedTrade | null>(null)

  React.useEffect(() => {
    if (!tableConfig) return
    const nextSorting = normalizeSorting(tableConfig.sorting)
    if (!areSortingStatesEqual(sorting, nextSorting)) {
      setSorting(nextSorting)
    }

    const nextFilters = tableConfig.columnFilters ?? []
    if (!areFiltersEqual(columnFilters, nextFilters)) {
      setColumnFilters(nextFilters)
    }

    const nextVisibility = tableConfig.columnVisibility ?? {}
    if (!areVisibilityEqual(columnVisibility, nextVisibility)) {
      setColumnVisibility(nextVisibility)
    }

    if (typeof tableConfig.pageSize === 'number' && tableConfig.pageSize !== pageSize) {
      setPageSize(tableConfig.pageSize)
    }

    if (typeof tableConfig.pageIndex === 'number' && tableConfig.pageIndex !== pageIndex) {
      setPageIndex(tableConfig.pageIndex)
    }
  }, [tableConfig, sorting, columnFilters, columnVisibility, pageSize, pageIndex])

  const handleSortingChange: OnChangeFn<SortingState> = React.useCallback(
    (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        updateSorting('trade-table', next)
        return next
      })
    },
    [updateSorting]
  )

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = React.useCallback(
    (updater) => {
      setColumnFilters((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        updateColumnFilters('trade-table', next)
        return next
      })
    },
    [updateColumnFilters]
  )

  const handleColumnVisibilityChange: OnChangeFn<VisibilityState> = React.useCallback(
    (updater) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        updateColumnVisibilityState('trade-table', next)
        return next
      })
    },
    [updateColumnVisibilityState]
  )

  const handlePageSizeChange = React.useCallback(
    (size: number) => {
      setPageSize(size)
      updatePageSize('trade-table', size)
    },
    [updatePageSize]
  )

  const handlePageIndexChange = React.useCallback(
    (index: number) => {
      setPageIndex(index)
      updatePageIndex('trade-table', index)
    },
    [updatePageIndex]
  )

  // Server-paginated trades (prevents multi-MB payloads on \"All time\")
  const { data: pagedTradesData, isLoading: isTradesLoading } = useFilteredTrades({
    accounts: accountNumbers?.length ? accountNumbers : undefined,
    dateFrom: dateRange?.from?.toISOString?.(),
    dateTo: dateRange?.to?.toISOString?.(),
    instruments: instruments?.length ? instruments : undefined,
    pnlMin: pnlRange?.min,
    pnlMax: pnlRange?.max,
    timeRange: timeRange?.range,
    weekday: weekdayFilter?.day,
    hour: hourFilter?.hour,
    includeStats: false,
    includeCalendar: false,
    timezone: timezone || 'UTC',
    pageLimit: pageSize,
    pageOffset: pageIndex * pageSize,
  }, true)

  const formattedTrades = React.useMemo(() => pagedTradesData?.trades ?? [], [pagedTradesData?.trades])
  const totalTrades = pagedTradesData?.total ?? 0
  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(totalTrades / pageSize)) : 1

  const handleViewDetails = React.useCallback((trade: ExtendedTrade) => {
    router.push(`/dashboard/table?view=details&tradeId=${trade.id}`)
  }, [router])

  const handleEditTrade = React.useCallback((trade: Trade | ExtendedTrade) => {
    router.push(`/dashboard/table?view=edit&tradeId=${trade.id}`)
  }, [router])

  const handleViewChart = React.useCallback((trade: ExtendedTrade) => {
    setSelectedTradeForChart(trade)
    setIsChartModalOpen(true)
  }, [])

  const handleSelectTrade = React.useCallback((tradeIds: string[], value: boolean) => {
    setSelectedTrades((prev) => {
      if (value) {
        const merged = new Set(prev)
        tradeIds.forEach((id) => merged.add(id))
        return Array.from(merged)
      }
      const toRemove = new Set(tradeIds)
      return prev.filter((id) => !toRemove.has(id))
    })
  }, [])

  const columns = useTradeTableColumns({
    timezone,
    onRowSelectionChange: handleSelectTrade,
    onViewDetails: handleViewDetails,
    onEditTrade: handleEditTrade,
    onViewChart: handleViewChart,
  })

  const groupedTrades = React.useMemo(
    () => buildGroupedTrades(formattedTrades as unknown as ExtendedTrade[]),
    [formattedTrades]
  )

  const table = useReactTable<ExtendedTrade>({
    data: groupedTrades,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      expanded,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    manualPagination: true,
    pageCount,
    enableRowSelection: true,
    paginateExpandedRows: false,
    onExpandedChange: setExpanded,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onPaginationChange: (updaterOrValue) => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue({ pageIndex, pageSize }) : updaterOrValue
      handlePageIndexChange(next.pageIndex)
      handlePageSizeChange(next.pageSize)
    },
    getSubRows: (row) => row.trades,
    getRowCanExpand: (row) => (row.original.trades?.length || 0) > 1,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  const tableRef = React.useRef<ReactTableInstance<ExtendedTrade> | null>(null)
  tableRef.current = table

  const handleGroupTrades = React.useCallback(async () => {
    if (selectedTrades.length < 2) return
    const tempGroupId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    await updateTrades(selectedTrades, { groupId: tempGroupId })
    tableRef.current?.resetRowSelection()
    setSelectedTrades([])
  }, [selectedTrades, updateTrades])

  const handleUngroupTrades = React.useCallback(async () => {
    if (selectedTrades.length === 0) return
    await updateTrades(selectedTrades, { groupId: null })
    tableRef.current?.resetRowSelection()
    setSelectedTrades([])
  }, [selectedTrades, updateTrades])

  return (
    <section className="w-full max-w-full space-y-6 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Trade History</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Review every execution, grouping, and adjustment in one view.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedTrades.length >= 2 && (
            <Button variant="outline" size="sm" onClick={handleGroupTrades} className="text-xs sm:text-sm">
              Group ({selectedTrades.length})
            </Button>
          )}
          {selectedTrades.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleUngroupTrades} className="text-xs sm:text-sm">
              Ungroup
            </Button>
          )}
          <ColumnConfigDialog tableId="trade-table" />
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl border border-border bg-background shadow-md">
        {isMobile ? (
          <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl">
            <Table className="w-full text-sm table-fixed">
              <TableHeader className="sticky top-0 z-20 bg-background border-b shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 px-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground w-[30%]">Instr.</TableHead>
                  <TableHead className="h-10 px-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground text-center w-[20%]">Side</TableHead>
                  <TableHead className="h-10 px-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground text-right w-[25%]">PnL</TableHead>
                  <TableHead className="h-10 px-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground text-center w-[25%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => {
                    const trade = row.original
                    const isLong = trade.side?.toUpperCase() === 'BUY' || trade.side?.toUpperCase() === 'LONG'
                    const pnlValue = trade.pnl
                    const isExpanded = row.getIsExpanded()

                    return (
                      <React.Fragment key={row.id}>
                        <TableRow
                          className="hover:bg-muted/30 active:bg-muted/50 transition-colors cursor-pointer touch-manipulation"
                          onClick={() => row.toggleExpanded()}
                        >
                          <TableCell className="px-3 py-3">
                            <span className="font-bold tracking-tight text-sm">{trade.instrument}</span>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-center">
                            <Badge variant={isLong ? 'default' : 'destructive'} className="text-[10px] uppercase font-bold px-2 py-0.5">
                              {trade.side?.toUpperCase().slice(0, 4)}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right">
                            <span className={cn('font-bold font-mono text-sm', pnlValue >= 0 ? 'text-profit' : 'text-loss')}>
                              {pnlValue >= 0 ? '+' : ''}{formatCurrency(pnlValue)}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-center">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 px-3 text-xs touch-manipulation"
                              onClick={(e) => { e.stopPropagation(); handleViewDetails(trade) }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                        {/* Accordion detail row */}
                        {isExpanded && (
                          <TableRow className="bg-muted/5 border-b border-border/30">
                            <TableCell colSpan={4} className="px-3 py-4">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Date</span>
                                  <span className="font-mono">{formatInTimeZone(new Date(trade.entryDate), timezone, 'yyyy-MM-dd')}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Entry</span>
                                  <span className="font-mono">{formatCurrency(parseFloat(String(trade.entryPrice)), getDecimalPlaces(trade.instrument, parseFloat(String(trade.entryPrice))))}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Close</span>
                                  <span className="font-mono">{formatCurrency(parseFloat(String(trade.closePrice)), getDecimalPlaces(trade.instrument, parseFloat(String(trade.closePrice))))}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Duration</span>
                                  <span className="font-mono">{parsePositionTime(trade.timeInPosition || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Comm.</span>
                                  <span className="font-mono">{formatCurrency(trade.commission)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Qty</span>
                                  <span className="font-mono">{formatQuantity(trade.quantity)}</span>
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-border/20">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-bold">Trade Notes</p>
                                <div className="max-h-[120px] overflow-y-auto bg-background/30 rounded-lg p-2 text-xs">
                                  {trade.comment && trade.comment.trim() !== '' && trade.comment !== '<p></p>' && !trade.comment.includes('"children":[]') && !trade.comment.includes('"text":""') ? (
                                    <div className="pointer-events-none scale-[0.95] origin-top-left w-[105%]">
                                      <LexicalEditor
                                        value={trade.comment}
                                        minHeight="60px"
                                      />
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground italic py-2">No notes attached.</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
                                <Button variant="outline" size="sm" className="h-10 text-xs flex-1 touch-manipulation font-medium" onClick={() => handleEditTrade(trade)}>
                                  Edit Trade
                                </Button>
                                <Button variant="outline" size="sm" className="h-10 text-xs flex-1 touch-manipulation font-medium" onClick={() => handleViewChart(trade)}>
                                  <BarChart3 className="h-4 w-4 mr-1.5" /> View Chart
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                        <div className="p-3 bg-muted/30 rounded-full">
                          <BarChart3 className="h-6 w-6 opacity-40" />
                        </div>
                        <p className="text-sm font-semibold">No trades found</p>
                        <p className="text-xs text-muted-foreground/70">Adjust filters or import trades</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto rounded-3xl max-h-[800px] overflow-y-auto">
            <Table className="w-full min-w-[1100px] lg:min-w-full text-sm">
              <TableHeader className="sticky top-0 z-20 bg-background border-b shadow-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          'h-11 px-2.5 text-left align-middle font-medium text-muted-foreground text-[11px] uppercase tracking-wide',
                          '[&:has([role=checkbox])]:pr-2'
                        )}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <TableRow
                        data-state={row.getIsSelected() && 'selected'}
                        className="transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              'px-2.5 py-2.5 align-middle text-xs whitespace-nowrap',
                              '[&:has([role=checkbox])]:pr-2'
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                      {row.getIsExpanded() && (row.original.trades?.length || 0) > 1 && (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={columns.length} className="px-10 py-4">
                            <div className="space-y-2 text-xs text-muted-foreground">
                              {row.original.trades?.map((trade) => (
                                <div
                                  key={trade.id}
                                  className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-dashed border-border/40 rounded-lg p-3 bg-background/50"
                                >
                                  <span className="font-semibold text-foreground">
                                    {trade.instrument} ({trade.side})
                                  </span>
                                  <span>Entry: {formatCurrency(parseFloat(String(trade.entryPrice)))}</span>
                                  <span>Exit: {formatCurrency(parseFloat(String(trade.closePrice)))}</span>
                                  <span>PnL: {formatCurrency(trade.pnl)}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center px-4 py-3 align-middle">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter className="sticky bottom-0 bg-background z-20 shadow-inner">
                <TableRow className="hover:bg-transparent border-t">
                  <TableCell colSpan={6} className="font-medium text-xs border-r">
                    Total Trades: {totalTrades}
                  </TableCell>
                  <TableCell colSpan={3} className="text-right font-medium text-xs">
                    Page P&L:
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono">
                    <span className={cn(table.getCoreRowModel().rows.reduce((sum, row) => sum + (row.original.pnl || 0), 0) >= 0 ? "text-profit" : "text-loss")}>
                      {table.getCoreRowModel().rows.reduce((sum, row) => sum + (row.original.pnl || 0), 0) >= 0 ? '+' : ''}{formatCurrency(table.getCoreRowModel().rows.reduce((sum, row) => sum + (row.original.pnl || 0), 0))}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatCurrency(table.getCoreRowModel().rows.reduce((sum, row) => sum + (row.original.commission || 0), 0))}
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm">
            <span className="text-muted-foreground whitespace-nowrap">
              {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Rows:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-14 text-xs">
                    {pageSize}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {[10, 25, 50, 100, 250].map((size) => (
                    <DropdownMenuItem key={size} onClick={() => handlePageSizeChange(size)}>
                      {size}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 px-2 sm:px-3 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <span className="text-xs sm:text-sm px-1 sm:px-2 whitespace-nowrap">
              {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 px-2 sm:px-3 text-xs"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="h-3.5 w-3.5 sm:ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <TradeChartModal
        isOpen={isChartModalOpen}
        onClose={() => {
          setIsChartModalOpen(false)
          setSelectedTradeForChart(null)
        }}
        trade={selectedTradeForChart}
      />
    </section>
  )
}

