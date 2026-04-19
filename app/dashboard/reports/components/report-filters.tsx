'use client'

import { useState } from 'react'
import { 
    Calendar as CalendarIcon, 
    Wallet,
    ChevronDown,
    Hash,
    Clock,
    CheckCircle2,
    Target,
    AlertCircle,
    SlidersHorizontal
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { CustomDateRangePicker, DateRange } from '@/components/ui/custom-date-range-picker'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface ReportFiltersProps {
    accounts: any[]
    selectedAccountId: string | null
    onAccountChange: (id: string | null) => void
    dateRange: DateRange | undefined
    onDateRangeChange: (range: DateRange | undefined) => void
    onPresetSelect: (range: string) => void
    activePreset?: string
    filters: {
        symbol: string
        session: string
        outcome: string
        strategy: string
        ruleBroken: string
    }
    options: {
        symbols: string[]
        sessions: string[]
        outcomes: { value: string; label: string }[]
        strategies: { id: string; name: string }[]
    }
    onFilterChange: (key: string, value: string) => void
}

export function ReportFilters({
    accounts,
    selectedAccountId,
    onAccountChange,
    dateRange,
    onDateRangeChange,
    onPresetSelect,
    activePreset,
    filters,
    options,
    onFilterChange
}: ReportFiltersProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)

    const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length

    return (
        <div className="mb-8 flex flex-col gap-3 no-export">
            <div className="rounded-[24px] border border-border/22 bg-card/40 p-3 sm:p-4">
            {/* Primary Controls — single row: Account | Presets | Date | Advanced toggle */}
            <div className="flex flex-wrap items-center gap-2.5">
                {/* Account Selector */}
                <Select
                    value={selectedAccountId || 'all'}
                    onValueChange={(val) => onAccountChange(val === 'all' ? null : val)}
                >
                    <SelectTrigger className="h-9 w-[160px] gap-1.5 rounded-xl border-border/18 bg-background/55 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-muted/20">
                        <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <SelectValue placeholder="All Accounts" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="text-[11px] font-bold uppercase">All Accounts</SelectItem>
                        {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id} className="text-[11px] font-bold uppercase">
                                {acc.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Divider */}
                <div className="hidden h-5 w-px bg-border/12 sm:block" />

                {/* Date Presets */}
                <div className="flex items-center gap-0.5 rounded-xl border border-border/14 bg-background/45 p-1">
                    {['7D', '30D', '90D', 'YTD', 'ALL'].map(preset => (
                        <Button
                            key={preset}
                            variant={activePreset === preset ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onPresetSelect(preset)}
                            className={cn(
                                "h-8 px-3 text-[10px] font-black tracking-widest rounded-lg transition-all",
                                activePreset === preset
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "hover:bg-muted/50 text-muted-foreground"
                            )}
                        >
                            {preset}
                        </Button>
                    ))}
                </div>

                {/* Divider */}
                <div className="hidden h-5 w-px bg-border/12 sm:block" />

                {/* Custom Date Picker */}
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-9 gap-2 rounded-xl border-border/18 bg-background/55 px-3 text-[11px] font-bold uppercase tracking-wider hover:bg-muted/20",
                                !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>{format(dateRange.from, "MMM dd")} – {format(dateRange.to, "MMM dd, yy")}</>
                                    ) : (
                                        format(dateRange.from, "MMM dd, yyyy")
                                    )
                                ) : (
                                    "Custom Range"
                                )}
                            </span>
                            <ChevronDown className="h-3 w-3 opacity-40" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto rounded-[24px] border-border/16 p-0 shadow-lg" align="end">
                        <CustomDateRangePicker
                            selected={dateRange}
                            onSelect={(range) => {
                                onDateRangeChange(range)
                                if (range?.from && range?.to) {
                                    setIsCalendarOpen(false)
                                }
                            }}
                            className="border-none shadow-none"
                        />
                    </PopoverContent>
                </Popover>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Advanced Filters Toggle */}
                <Button
                    variant={showAdvanced ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={cn(
                        "h-9 gap-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all",
                        showAdvanced
                            ? "bg-primary text-primary-foreground"
                            : "border-border/22 bg-background/55 hover:bg-muted/20"
                    )}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary-foreground/20 text-[9px] font-black">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
            </div>
            </div>

            {/* Advanced Filters — collapsible row */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
                    <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-border/18 bg-card/30 p-3 sm:grid-cols-3 lg:grid-cols-5">
                        {/* Symbol */}
                        <FilterSelect
                            icon={<Hash className="h-3 w-3" />}
                            label="Symbol"
                            value={filters.symbol}
                            onChange={(v) => onFilterChange('symbol', v)}
                            placeholder="All Symbols"
                            options={options.symbols.map(s => ({ value: s, label: s }))}
                        />

                        {/* Session */}
                        <FilterSelect
                            icon={<Clock className="h-3 w-3" />}
                            label="Session"
                            value={filters.session}
                            onChange={(v) => onFilterChange('session', v)}
                            placeholder="All Sessions"
                            options={options.sessions.map(s => ({ value: s, label: s }))}
                        />

                        {/* Outcome */}
                        <FilterSelect
                            icon={<CheckCircle2 className="h-3 w-3" />}
                            label="Outcome"
                            value={filters.outcome}
                            onChange={(v) => onFilterChange('outcome', v)}
                            placeholder="All Outcomes"
                            options={options.outcomes}
                        />

                        {/* Strategy */}
                        <FilterSelect
                            icon={<Target className="h-3 w-3" />}
                            label="Strategy"
                            value={filters.strategy}
                            onChange={(v) => onFilterChange('strategy', v)}
                            placeholder="All Systems"
                            options={options.strategies.map(s => ({ value: s.id, label: s.name }))}
                        />

                        {/* Rule Status */}
                        <FilterSelect
                            icon={<AlertCircle className="h-3 w-3" />}
                            label="Rule Status"
                            value={filters.ruleBroken}
                            onChange={(v) => onFilterChange('ruleBroken', v)}
                            placeholder="All Status"
                            options={[
                                { value: 'broken', label: 'Broken' },
                                { value: 'followed', label: 'Followed' },
                            ]}
                        />
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}

/** Reusable filter select with icon + label */
function FilterSelect({
    icon,
    label,
    value,
    onChange,
    placeholder,
    options,
}: {
    icon: React.ReactNode
    label: string
    value: string
    onChange: (value: string) => void
    placeholder: string
    options: { value: string; label: string }[]
}) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 px-1 text-muted-foreground">
                {icon}
                <span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
            </div>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-8 rounded-lg border-border/18 bg-background/55 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-muted/20">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/16">
                    <SelectItem value="all" className="text-[11px] font-bold uppercase">{placeholder}</SelectItem>
                    {options.map(o => (
                        <SelectItem key={o.value} value={o.value} className="text-[11px] font-bold uppercase">{o.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
