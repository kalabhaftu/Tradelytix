'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useData } from '@/context/data-provider'
import { formatTimeInZone } from '@/lib/time-utils'
import { classifyTrade, cn } from '@/lib/utils'
import {
    Zap,
    Share2,
    Target,
    TrendingUp,
    Building2,
    Clock,
    List,
    Table as TableIcon,
    Download,
    FileText,
    Image as ImageIcon,
    LayoutDashboard
} from 'lucide-react'
import {
    format,
    startOfYear,
    subDays,
    subMonths,
    endOfDay
} from 'date-fns'
import { motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useUserStore } from '@/store/user-store'
import { DateRange } from '@/components/ui/custom-date-range-picker'
import { toast } from 'sonner'
import { ReportFilters } from './components/report-filters'
import { useReportStats } from '@/hooks/use-report-stats'
import { 
    Area, 
    AreaChart, 
    ResponsiveContainer, 
    Tooltip as RechartsTooltip, 
    XAxis, 
    YAxis 
} from 'recharts'

const COLORS = {
    bullish: 'hsl(var(--chart-bullish))',
    bearish: 'hsl(var(--chart-bearish))',
    muted: 'hsl(220, 15%, 55%)'
}

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip'
import { DiverseCharts } from './components/diverse-charts'
import { PerformanceCard } from './components/performance-card'
import { PropFirmTab } from './components/propfirm-tab'

// Dense Metric Block component
function MetricBlock({
    label,
    value,
    subValue,
    color = 'neutral',
    info,
    className
}: {
    label: string
    value: string | number
    subValue?: string | React.ReactNode
    color?: 'long' | 'short' | 'neutral' | 'info'
    info?: string
    className?: string
}) {
    const colorClasses = {
        long: 'text-long',
        short: 'text-short',
        info: 'text-primary',
        neutral: 'text-foreground'
    }

    return (
        <div className={cn("space-y-1", className)}>
            <p className="text-[8px] uppercase font-black text-muted-foreground/60 tracking-widest">{label}</p>
            <p className={cn("text-lg font-black font-mono tracking-tighter", colorClasses[color])}>
                {value}
            </p>
            {subValue && (
                <p className="text-[9px] text-muted-foreground/40 font-medium">{subValue}</p>
            )}
        </div>
    )
}

// Session Block for session metrics tab
function SessionBlock({
    name,
    range,
    trades,
    wins,
    pnl,
    totalHoldMs,
    peak,
    maxDD
}: {
    name: string
    range: string
    trades: number
    wins: number
    pnl: number
    totalHoldMs: number
    peak: number
    maxDD: number
}) {
    const winRate = trades > 0 ? ((wins / trades) * 100).toFixed(1) : '0.0'
    const avgHoldMs = trades > 0 ? totalHoldMs / trades : 0
    const h = Math.floor(avgHoldMs / (1000 * 60 * 60))
    const m = Math.floor((avgHoldMs % (1000 * 60 * 60)) / (1000 * 60))

    return (
        <div className={cn(
            "p-5 rounded-2xl border bg-card/50 space-y-3",
            trades === 0 ? "opacity-40" : "border-border/40"
        )}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest">{name}</h3>
                    <p className="text-[8px] font-bold text-muted-foreground/50 tracking-wider mt-0.5">{range}</p>
                </div>
                <div className={cn("text-lg font-black font-mono", pnl >= 0 ? "text-long" : "text-short")}>
                    ${pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div>
                    <p className="text-[8px] uppercase font-black text-muted-foreground/40 mb-1">Trades</p>
                    <p className="text-lg font-black font-mono">{trades}</p>
                </div>
                <div>
                    <p className="text-[8px] uppercase font-black text-muted-foreground/40 mb-1">Win Rate</p>
                    <p className="text-lg font-black font-mono">{winRate}%</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/20">
                <div className="text-center">
                    <p className="text-[7px] uppercase font-bold text-muted-foreground/50 mb-0.5">Trades</p>
                    <p className="text-[10px] font-black">{trades}</p>
                </div>
                <div className="text-center border-x border-border/10">
                    <p className="text-[7px] uppercase font-bold text-muted-foreground/50 mb-0.5">Avg Hold</p>
                    <p className="text-[10px] font-black">{h}h {m}m</p>
                </div>
                <div className="text-center">
                    <p className="text-[7px] uppercase font-bold text-muted-foreground/50 mb-0.5">Max DD</p>
                    <p className="text-[10px] font-black">${maxDD.toFixed(0)}</p>
                </div>
            </div>
        </div>
    )
}

export default function ReportsPage() {
    const { accounts } = useData()
    const user = useUserStore(state => state.user)

    // Filter State
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 90),
        to: new Date()
    })
    const [selectedTab, setSelectedTab] = useState('overview')
    const [isExporting, setIsExporting] = useState(false)
    const [activePreset, setActivePreset] = useState<string>('90D')

    // Advanced Filters State
    const [advancedFilters, setAdvancedFilters] = useState({
        symbol: 'all',
        session: 'all',
        outcome: 'all',
        strategy: 'all',
        ruleBroken: 'all'
    })

    // SERVER-SIDE: Use React Query hook instead of client-side fetching + useMemo
    const { data: reportData, isLoading } = useReportStats({
        accountId: selectedAccountId || undefined,
        dateFrom: dateRange?.from?.toISOString(),
        dateTo: dateRange?.to?.toISOString(),
        symbol: advancedFilters.symbol !== 'all' ? advancedFilters.symbol : undefined,
        session: advancedFilters.session !== 'all' ? advancedFilters.session : undefined,
        outcome: advancedFilters.outcome !== 'all' ? advancedFilters.outcome : undefined,
        strategy: advancedFilters.strategy !== 'all' ? advancedFilters.strategy : undefined,
        ruleBroken: advancedFilters.ruleBroken !== 'all' ? advancedFilters.ruleBroken : undefined,
    })

    // Extract server-computed data
    const tradingActivity = reportData?.tradingActivity ?? null
    const psychMetrics = reportData?.psychMetrics ?? null
    const sessionPerformance = reportData?.sessionPerformance ?? null
    const rMultipleDistribution = reportData?.rMultipleDistribution ?? null

    // Pre-computed R-Multiple data for Recharts
    const rMultipleChartData = useMemo(() => {
        if (!rMultipleDistribution) return []
        return Object.entries(rMultipleDistribution).map(([bucket, rawCount]) => {
            const count = Number(rawCount)
            const isNegative = bucket.includes('<') || bucket.includes('-')
            return {
                name: bucket,
                count,
                color: isNegative ? COLORS.bearish : COLORS.bullish
            }
        })
    }, [rMultipleDistribution])

    const RMultipleTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border p-2 rounded-lg shadow-md">
                    <p className="text-[10px] uppercase font-black text-muted-foreground/70 mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold" style={{ color: payload[0].payload.color }}>
                            {payload[0].value} Trades
                        </span>
                    </div>
                </div>
            )
        }
        return null
    }
    const filteredTrades = reportData?.filteredTrades ?? []
    const filterOptions = reportData?.filterOptions ?? {
        symbols: [],
        sessions: [],
        outcomes: [],
        strategies: []
    }

    const handlePresetSelect = (preset: string) => {
        const today = new Date()
        setActivePreset(preset)
        switch (preset) {
            case '7D':
                setDateRange({ from: subDays(today, 7), to: today })
                break
            case '30D':
                setDateRange({ from: subDays(today, 30), to: today })
                break
            case '90D':
                setDateRange({ from: subMonths(today, 3), to: today })
                break
            case 'YTD':
                setDateRange({ from: startOfYear(today), to: today })
                break
            case 'ALL':
                setDateRange({ from: new Date(2000, 0, 1), to: today })
                setActivePreset('ALL')
                break
        }
    }

    // Export trades as CSV
    const handleExportCSV = useCallback(() => {
        if (!filteredTrades || filteredTrades.length === 0) {
            toast.error('No trades to export')
            return
        }

        setIsExporting(true)
        try {
            const headers = [
                'Date', 'Instrument', 'Side', 'Entry Price', 'Close Price',
                'Quantity', 'P&L', 'Commission', 'Net P&L', 'Account'
            ]

            const rows = filteredTrades.map((trade: any) => [
                format(new Date(trade.entryDate), 'yyyy-MM-dd HH:mm'),
                trade.instrument || '',
                trade.side || '',
                trade.entryPrice || 0,
                trade.closePrice || 0,
                trade.quantity || 0,
                trade.pnl || 0,
                trade.commission || 0,
                (trade.pnl || 0) - (trade.commission || 0),
                trade.accountNumber || ''
            ])

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `deltalytix-trades-${format(new Date(), 'yyyy-MM-dd')}.csv`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('CSV exported successfully!')
        } catch (err) {
            console.error('[Reports] CSV export error:', err)
            toast.error('Failed to export CSV')
        } finally {
            setIsExporting(false)
        }
    }, [filteredTrades])

    // Screenshot page snapshot
    const handlePageSnapshot = useCallback(async () => {
        const element = document.getElementById('report-content')
        if (!element) return

        setIsExporting(true)
        try {
            const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
            const resolvedBg = bgColor ? `hsl(${bgColor})` : '#0d0d0d'
            const rect = element.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1

            const canvas = await html2canvas(element, {
                scale: Math.max(dpr, 2),
                backgroundColor: resolvedBg,
                useCORS: true,
                logging: false,
                windowWidth: Math.round(rect.width),
                windowHeight: Math.round(rect.height),
                onclone: (_clonedDoc: Document, clonedContent: HTMLElement) => {
                    clonedContent.style.width = `${rect.width}px`
                    clonedContent.style.background = resolvedBg
                    clonedContent.querySelectorAll('.no-export').forEach((el) => {
                        (el as HTMLElement).style.display = 'none'
                    })
                },
            })

            canvas.toBlob((blob) => {
                if (!blob) { toast.error('Snapshot failed'); return }
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.download = `deltalytix-report-${Date.now()}.png`
                a.href = url
                a.click()
                URL.revokeObjectURL(url)
                toast.success('Page snapshot saved!')
            }, 'image/png')
        } catch (err) {
            console.error('[Reports] snapshot error:', err)
            toast.error('Failed to capture snapshot')
        } finally {
            setIsExporting(false)
        }
    }, [])

    const handleFilterChange = (key: string, value: string) => {
        setAdvancedFilters(prev => ({ ...prev, [key]: value }))
    }

    const periodLabel = dateRange?.from && dateRange?.to
        ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
        : 'Select Period'

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 pb-20 md:pb-8 overflow-hidden" id="report-content">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Reports</h1>
                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                            {periodLabel}
                        </p>
                    </div>
                    <div className="no-export flex items-center gap-2">
                        {/* Export CSV Button */}
                        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isExporting} className="h-8 text-[11px] font-bold uppercase tracking-wider border-border/30 hover:bg-muted-foreground/10 rounded-xl gap-1.5">
                            <Download className="h-3.5 w-3.5 opacity-60" />
                            Export CSV
                        </Button>

                        {/* Share Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase tracking-wider border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl gap-1.5">
                                    <Share2 className="h-3.5 w-3.5" />
                                    Share
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 text-xs font-medium cursor-pointer">
                                            <LayoutDashboard className="h-3.5 w-3.5" />
                                            Performance Card
                                        </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-2xl bg-card border border-border/10 p-0 overflow-hidden rounded-[32px]">
                                        <div className="p-8">
                                            <DialogHeader className="mb-6">
                                                <DialogTitle className="text-xl font-black tracking-tighter uppercase">Generate Performance Asset</DialogTitle>
                                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Render high-fidelity performance card for your network</DialogDescription>
                                            </DialogHeader>
                                            {tradingActivity && psychMetrics && (
                                                <div className="flex justify-center">
                                                    <PerformanceCard
                                                        period={"LATEST AUDIT"}
                                                        stats={{
                                                            totalTrades: tradingActivity.totalTrades,
                                                            winRate: tradingActivity.winRate,
                                                            totalPnL: psychMetrics.totalNetPnL,
                                                            longestWinStreak: psychMetrics.longestWinStreak,
                                                            longestLoseStreak: psychMetrics.longestLoseStreak,
                                                            tradingDays: tradingActivity.tradingDaysActive,
                                                            avgTradesPerMonth: tradingActivity.avgTradesPerMonth
                                                        }}
                                                        userName={user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : undefined}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                                                <span>Trader: <span className="font-semibold text-foreground">{user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : 'Set your name in settings'}</span></span>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <DropdownMenuItem onClick={handlePageSnapshot} disabled={isExporting} className="gap-2 text-xs font-medium">
                                    <ImageIcon className="h-3.5 w-3.5" />
                                    Page Snapshot
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <ReportFilters
                    accounts={accounts || []}
                    selectedAccountId={selectedAccountId}
                    onAccountChange={setSelectedAccountId}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    onPresetSelect={handlePresetSelect}
                    activePreset={activePreset}
                    filters={advancedFilters}
                    options={filterOptions}
                    onFilterChange={handleFilterChange}
                />

                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <Skeleton key={i} className="h-28 rounded-lg bg-muted/20" />
                        ))}
                    </div>
                ) : !tradingActivity || !psychMetrics || filteredTrades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/5">
                        <Zap className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/50 mb-4">Journal is empty for this period</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePresetSelect('ALL')}
                            className="text-[10px] font-black uppercase tracking-widest"
                        >
                            View All Time
                        </Button>
                    </div>
                ) : (
                    <Tabs defaultValue="overview" className="w-full" onValueChange={setSelectedTab}>
                        <TabsList className="mb-8 p-1 bg-muted/20 border border-border/40 rounded-xl no-export overflow-x-auto w-full justify-start sm:justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <TabsTrigger value="overview" className="px-3 sm:px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap">
                                <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="sessions" className="px-3 sm:px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                Sessions
                            </TabsTrigger>
                            <TabsTrigger value="spreadsheet" className="px-3 sm:px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap">
                                <List className="h-3.5 w-3.5 shrink-0" />
                                Spreadsheet
                            </TabsTrigger>
                            <TabsTrigger value="propfirm" className="px-3 sm:px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap">
                                <Building2 className="h-3.5 w-3.5 shrink-0" />
                                Funded
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="space-y-12 focus-visible:outline-none">
                            <div className="space-y-10">
                                {/* Main KPI Bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 py-6 border-y border-border/40">
                                    <div className="flex flex-col">
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Total P/L</p>
                                        <p className={cn("text-2xl sm:text-3xl font-black font-mono tracking-tighter", psychMetrics.totalNetPnL >= 0 ? "text-long" : "text-short")}>
                                            ${psychMetrics.totalNetPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Win Rate</p>
                                        <p className="text-2xl sm:text-3xl font-black font-mono tracking-tighter text-foreground">{tradingActivity.winRate}%</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Profit Factor</p>
                                        <p className="text-2xl sm:text-3xl font-black font-mono tracking-tighter text-primary">{psychMetrics.profitFactor}</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Expectancy</p>
                                        <p className="text-2xl sm:text-3xl font-black font-mono tracking-tighter text-foreground">${psychMetrics.expectancy}</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Max Drawdown</p>
                                        <p className="text-2xl sm:text-3xl font-black font-mono tracking-tighter text-short">${psychMetrics.maxDrawdown}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:items-stretch">
                                    {/* Detailed Metrics Table */}
                                    <div className="lg:col-span-7 space-y-6">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <h2 className="text-[11px] uppercase tracking-[0.2em] font-black text-muted-foreground">Detailed Performance Audit</h2>
                                        </div>
                                        <div className="border border-border/40 rounded-2xl overflow-hidden bg-muted/5 h-full">
                                            <Table>
                                                <TableBody>
                                                    <TableRow className="border-border/10 hover:bg-transparent">
                                                        <TableCell className="text-[10px] font-black uppercase text-muted-foreground/60 py-3">Total Trades / Active Days</TableCell>
                                                        <TableCell className="text-right font-bold py-3">{tradingActivity.totalTrades} / {tradingActivity.tradingDaysActive}</TableCell>
                                                    </TableRow>
                                                    <TableRow className="border-border/10 hover:bg-transparent">
                                                        <TableCell className="text-[10px] font-black uppercase text-muted-foreground/60 py-3">Average Win / Average Loss</TableCell>
                                                        <TableCell className="text-right font-bold py-3">
                                                            <span className="text-long">${psychMetrics.avgWin}</span> / <span className="text-short">${psychMetrics.avgLoss}</span>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow className="border-border/10 hover:bg-transparent">
                                                        <TableCell className="text-[10px] font-black uppercase text-muted-foreground/60 py-3">Peak Equity</TableCell>
                                                        <TableCell className="text-right font-bold py-3 text-long">${psychMetrics.peakEquity}</TableCell>
                                                    </TableRow>
                                                    <TableRow className="border-border/10 hover:bg-transparent">
                                                        <TableCell className="text-[10px] font-black uppercase text-muted-foreground/60 py-3">Average Holding Time</TableCell>
                                                        <TableCell className="text-right font-bold py-3">{psychMetrics.avgHoldingTime}</TableCell>
                                                    </TableRow>
                                                    <TableRow className="border-border/10 hover:bg-transparent">
                                                        <TableCell className="text-[10px] font-black uppercase text-muted-foreground/60 py-3">Win/Loss Streaks</TableCell>
                                                        <TableCell className="text-right font-bold py-3">
                                                            <span className="text-long">{psychMetrics.longestWinStreak}W</span> / <span className="text-short">{psychMetrics.longestLoseStreak}L</span>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow className="border-border/10 hover:bg-transparent">
                                                        <TableCell className="text-[10px] font-black uppercase text-muted-foreground/60 py-3">Most Traded Day</TableCell>
                                                        <TableCell className="text-right font-bold py-3">{tradingActivity.mostTradedDay || '—'}</TableCell>
                                                    </TableRow>
                                                    <TableRow className="border-border/10 hover:bg-transparent">
                                                        <TableCell className="text-[10px] font-black uppercase text-muted-foreground/60 py-3">Most Profitable Day</TableCell>
                                                        <TableCell className="text-right font-bold py-3 text-long">{tradingActivity.mostProfitableDay || '—'}</TableCell>
                                                    </TableRow>
                                                    <TableRow className="border-border/10 hover:bg-transparent">
                                                        <TableCell className="text-[10px] font-black uppercase text-muted-foreground/60 py-3">Most Profitable Pair</TableCell>
                                                        <TableCell className="text-right font-bold py-3 text-long">{tradingActivity.mostProfitablePair || '—'}</TableCell>
                                                    </TableRow>
                                                    <TableRow className="border-border/10 hover:bg-transparent">
                                                        <TableCell className="text-[10px] font-black uppercase text-muted-foreground/60 py-3">Most Losing Day</TableCell>
                                                        <TableCell className="text-right font-bold py-3 text-short">{tradingActivity.mostLosingDay || '—'}</TableCell>
                                                    </TableRow>
                                                    <TableRow className="border-border/10 hover:bg-transparent">
                                                        <TableCell className="text-[10px] font-black uppercase text-muted-foreground/60 py-3">Most Losing Pair</TableCell>
                                                        <TableCell className="text-right font-bold py-3 text-short">{tradingActivity.mostLosingPair || '—'}</TableCell>
                                                    </TableRow>
                                                    <TableRow className="border-none hover:bg-transparent">
                                                        <TableCell className="text-[10px] font-black uppercase text-muted-foreground/60 py-3">Account Yield</TableCell>
                                                        <TableCell className={cn("text-right font-black py-3", psychMetrics.totalNetPnL >= 0 ? "text-long" : "text-short")}>
                                                            {psychMetrics.totalNetPnL >= 0 ? '+' : ''}{((psychMetrics.totalNetPnL / Math.max(1, (accounts?.[0]?.startingBalance || 10000))) * 100).toFixed(2)}%
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>

                                    {/* R-Multiple Distribution Chart */}
                                    <div className="lg:col-span-5 space-y-4 flex flex-col">
                                        <div className="flex flex-col space-y-6">
                                            <div className="space-y-4">
                                                <h2 className="text-[11px] uppercase tracking-[0.2em] font-black text-muted-foreground">R-Multiple Distribution</h2>
                                                <div className="bg-muted/5 border border-border/40 rounded-2xl p-6 h-[280px] flex flex-col">
                                                    <div className="flex-1 w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={rMultipleChartData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                                                                <defs>
                                                                    <linearGradient id="colorRMultiple" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15}/>
                                                                        <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0}/>
                                                                    </linearGradient>
                                                                </defs>
                                                                <XAxis 
                                                                    dataKey="name" 
                                                                    axisLine={false} 
                                                                    tickLine={false} 
                                                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                                                />
                                                                <YAxis hide />
                                                                <RechartsTooltip content={<RMultipleTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                                                <Area 
                                                                    type="monotone" 
                                                                    dataKey="count" 
                                                                    stroke="hsl(var(--foreground))" 
                                                                    strokeWidth={2}
                                                                    fillOpacity={1} 
                                                                    fill="url(#colorRMultiple)"
                                                                    animationDuration={1000}
                                                                />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Clever Gap Filler: Risk Intelligence Audit */}
                                            <div className="bg-muted/5 border border-border/40 rounded-2xl p-6 flex-1 flex flex-col justify-center">
                                                <div className="flex items-center justify-between mb-6">
                                                    <h3 className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-[0.2em]">Risk Intelligence Audit</h3>
                                                    <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] uppercase font-bold text-muted-foreground/50 tracking-widest">RR Efficiency</p>
                                                        <p className="text-xl font-black font-mono tracking-tighter">
                                                            {psychMetrics.rrEfficiency}
                                                        </p>
                                                        <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-long transition-all duration-1000" 
                                                                style={{ width: `${Math.min(100, parseFloat(psychMetrics.rrEfficiency) * 40)}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] uppercase font-bold text-muted-foreground/50 tracking-widest">Recovery Factor</p>
                                                        <p className="text-xl font-black font-mono tracking-tighter">
                                                            {psychMetrics.recoveryFactor}
                                                        </p>
                                                        <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-primary transition-all duration-1000" 
                                                                style={{ width: `${Math.min(100, parseFloat(psychMetrics.recoveryFactor) * 20)}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] uppercase font-bold text-muted-foreground/50 tracking-widest">Expectancy / Trade</p>
                                                        <p className="text-xl font-black font-mono tracking-tighter text-foreground">${psychMetrics.expectancy}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] uppercase font-bold text-muted-foreground/50 tracking-widest">Consistency Score</p>
                                                        <p className="text-xl font-black font-mono tracking-tighter">
                                                            {psychMetrics.consistencyScore}%
                                                        </p>
                                                        <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-foreground transition-all duration-1000" 
                                                                style={{ width: `${psychMetrics.consistencyScore}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] uppercase font-bold text-muted-foreground/50 tracking-widest">Total R-Multiple</p>
                                                        <p className={cn("text-xl font-black font-mono tracking-tighter", parseFloat(psychMetrics.totalRMultiple) >= 0 ? "text-long" : "text-short")}>
                                                            {parseFloat(psychMetrics.totalRMultiple) > 0 ? '+' : ''}{psychMetrics.totalRMultiple}R
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rich Visualizations */}
                                {reportData?.chartData && (
                                    <DiverseCharts chartData={reportData.chartData} />
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="sessions" className="space-y-8 focus-visible:outline-none">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sessionPerformance && Object.values(sessionPerformance).map((session, i) => (
                                    <SessionBlock key={i} {...session} />
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="spreadsheet" className="focus-visible:outline-none">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <h3 className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Recent Activity</h3>
                                <span className="text-[9px] font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">Displaying up to 100 most recent trades</span>
                            </div>
                            <div className="border border-border/40 rounded-xl overflow-x-auto no-scrollbar bg-card/50">
                              <div className="min-w-[700px] w-full">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="border-border/40 hover:bg-transparent">
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest h-10">Entry Date</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest h-10">Asset</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest h-10">Side</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest h-10">Lots</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest h-10">Result</TableHead>
                                            <TableHead className="text-[9px] font-black uppercase tracking-widest h-10 text-right">Net P&L</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[...filteredTrades].sort((a, b) => new Date(b.entryDate!).getTime() - new Date(a.entryDate!).getTime()).map((trade: any) => {
                                            const netPnL = (trade.pnl || 0) + (trade.commission || 0)
                                            const outcome = classifyTrade(netPnL)
                                            return (
                                                <TableRow key={trade.id} className="border-border/20 hover:bg-muted/5 group transition-colors">
                                                    <TableCell className="text-[10px] font-bold font-mono py-2 opacity-60">
                                                        {trade.entryDate ? formatTimeInZone(trade.entryDate.includes('Z') ? trade.entryDate : `${trade.entryDate}Z`, 'yyyy-MM-dd HH:mm') : 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="text-[10px] font-black py-2">{trade.symbol || trade.instrument || '—'}</TableCell>
                                                    <TableCell className="py-2">
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                                                            (trade.side?.toLowerCase() === 'long' || trade.side?.toLowerCase() === 'buy') ? "bg-long/10 text-long" : "bg-short/10 text-short"
                                                        )}>
                                                            {trade.side}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-[10px] font-mono py-2">{trade.quantity}</TableCell>
                                                    <TableCell className="py-2">
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase",
                                                            outcome === 'win' ? "text-long" : outcome === 'loss' ? "text-short" : "text-muted-foreground"
                                                        )}>
                                                            {outcome}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className={cn(
                                                        "text-[10px] font-bold font-mono text-right py-2",
                                                        netPnL >= 0 ? "text-long" : "text-short"
                                                    )}>
                                                        ${netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                              </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="propfirm" className="focus-visible:outline-none">
                            <PropFirmTab />
                        </TabsContent>
                    </Tabs>
                )}
            </motion.div>
        </div>
    )
}
