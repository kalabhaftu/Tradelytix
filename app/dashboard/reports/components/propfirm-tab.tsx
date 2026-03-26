'use client'

import { usePropFirmStats } from '@/hooks/use-propfirm-stats'
import type { PropFirmSummaryDTO } from '@/lib/statistics/propfirm-statistics'
import { cn } from '@/lib/utils'
import { PropFirmTabRouteSkeleton } from '@/components/ui/non-dashboard-skeletons'
import {
    Trophy,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    TrendingDown,
    TrendingUp,
    Building2,
    Activity,
} from 'lucide-react'

// ────────────────────────────────────────────────────────────
// STATUS HELPERS
// ────────────────────────────────────────────────────────────

function statusLabel(phaseStatus: string, masterStatus: string) {
    if (phaseStatus === 'failed' || masterStatus === 'failed') return 'Blown'
    if (phaseStatus === 'passed') return 'Passed'
    if (masterStatus === 'funded' && phaseStatus === 'active') return 'Funded'
    if (phaseStatus === 'active') return 'Active'
    if (phaseStatus === 'pending' || phaseStatus === 'pending_approval') return 'Pending'
    return phaseStatus
}

function statusColor(phaseStatus: string, masterStatus: string) {
    const label = statusLabel(phaseStatus, masterStatus)
    if (label === 'Blown') return 'text-short bg-short/10 border-short/20'
    if (label === 'Passed') return 'text-long bg-long/10 border-long/20'
    if (label === 'Funded') return 'text-primary bg-primary/10 border-primary/20'
    if (label === 'Active') return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    return 'text-muted-foreground bg-muted/30 border-border/40'
}

// ────────────────────────────────────────────────────────────
// STAT CHIP
// ────────────────────────────────────────────────────────────

function Chip({ label, value, color }: { label: string; value: string | number; color?: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">{label}</span>
            <span className={cn("text-[11px] font-black font-mono", color ?? "text-foreground")}>{value}</span>
        </div>
    )
}

// ────────────────────────────────────────────────────────────
// ACCOUNT CARD
// ────────────────────────────────────────────────────────────

function AccountCard({ account }: { account: any }) {
    const label = statusLabel(account.phaseStatus, account.masterStatus)
    const colorClass = statusColor(account.phaseStatus, account.masterStatus)
    const pnlColor = account.totalNetPnL >= 0 ? 'text-long' : 'text-short'

    // Progress toward profit target
    const profitTargetDollar = account.accountSize * (account.profitTargetPercent / 100)
    const progressPct = profitTargetDollar > 0
        ? Math.min(100, Math.max(0, (account.totalNetPnL / profitTargetDollar) * 100))
        : 0

    return (
        <div className="bg-card border border-border/40 rounded-2xl p-5 flex flex-col gap-4 hover:border-border/70 transition-all group">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-primary/70" />
                        <span className="text-[9px] font-black text-primary/80 uppercase tracking-widest">{account.propFirmName}</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-tight text-foreground">{account.accountName}</span>
                    <span className="text-[9px] text-muted-foreground/50 font-medium">Phase {account.phaseNumber} · ${account.accountSize.toLocaleString()}</span>
                </div>
                <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border", colorClass)}>
                    {label}
                </span>
            </div>

            {/* P&L */}
            <div className="flex items-baseline gap-1.5">
                <span className={cn("text-2xl font-black font-mono tracking-tighter", pnlColor)}>
                    {account.totalNetPnL >= 0 ? '+' : ''}${account.totalNetPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-muted-foreground/50 font-bold">Net P&L</span>
            </div>

            {/* Progress bar toward profit target */}
            {account.profitTargetPercent > 0 && (
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] text-muted-foreground/50 font-bold uppercase tracking-widest">Profit Target Progress</span>
                        <span className="text-[8px] font-black text-foreground/60">{progressPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all", account.totalNetPnL >= 0 ? "bg-long" : "bg-short")}
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] text-muted-foreground/40">$0</span>
                        <span className="text-[8px] text-muted-foreground/40">${profitTargetDollar.toLocaleString()} ({account.profitTargetPercent}%)</span>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 border-t border-border/30 pt-4">
                <Chip label="Win Rate" value={`${account.winRate}%`}
                    color={parseFloat(account.winRate) >= 50 ? 'text-long' : 'text-short'} />
                <Chip label="Profit Factor" value={account.profitFactor}
                    color={parseFloat(account.profitFactor) >= 1 ? 'text-long' : 'text-short'} />
                <Chip label="Expectancy" value={`$${account.expectancy}`}
                    color={parseFloat(account.expectancy) >= 0 ? 'text-long' : 'text-short'} />
                <Chip label="Trades" value={account.totalTrades} />
                <Chip label="Active Days" value={account.tradingDaysActive} />
                <Chip label="Duration" value={`${account.durationDays}d`} />
            </div>

            {/* Risk Row */}
            <div className="grid grid-cols-2 gap-3 border-t border-border/30 pt-3">
                <div className="flex items-center gap-1.5">
                    <TrendingDown className="h-3 w-3 text-short/70" />
                    <div className="flex flex-col">
                        <span className="text-[8px] text-muted-foreground/50 uppercase font-bold tracking-wider">Max DD</span>
                        <span className="text-[10px] font-black font-mono text-short">
                            ${account.maxDrawdown.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            <span className="text-muted-foreground/40 font-medium ml-1">({account.maxDrawdownPct}%)</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-long/70" />
                    <div className="flex flex-col">
                        <span className="text-[8px] text-muted-foreground/50 uppercase font-bold tracking-wider">Peak Profit</span>
                        <span className="text-[10px] font-black font-mono text-long">
                            ${account.peakProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payouts & Breaches */}
            {(account.totalPayouts > 0 || account.breachCount > 0) && (
                <div className="flex items-center gap-3 border-t border-border/30 pt-3">
                    {account.totalPayouts > 0 && (
                        <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-primary" />
                            <span className="text-[9px] font-black text-primary">
                                ${account.totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2 })} Received
                            </span>
                        </div>
                    )}
                    {account.breachCount > 0 && (
                        <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-400" />
                            <span className="text-[9px] font-black text-amber-400">{account.breachCount} Breach{account.breachCount > 1 ? 'es' : ''}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

interface PropFirmTabProps {
    initialData?: PropFirmSummaryDTO
}

export function PropFirmTab({ initialData }: PropFirmTabProps) {
    const { data, isLoading } = usePropFirmStats(initialData)

    if (isLoading) {
        return <PropFirmTabRouteSkeleton />
    }

    if (!data || data.accounts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/5">
                <Building2 className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">No Prop Firm Accounts</h3>
                <p className="text-[10px] text-muted-foreground/40 font-medium">Import trades linked to prop firm phases to see analytics here</p>
            </div>
        )
    }

    const accountStats = [
        { label: 'Total Accounts', value: data.totalAccounts, icon: Building2, color: 'text-foreground' },
        { label: 'Active', value: data.activeAccounts, icon: Activity, color: 'text-blue-400' },
        { label: 'Funded', value: data.fundedAccounts, icon: CheckCircle2, color: 'text-primary' },
        { label: 'Failed', value: data.failedAccounts, icon: XCircle, color: 'text-short' },
        { label: 'Phases Passed', value: data.passedPhases, icon: Trophy, color: 'text-long' },
        { label: 'Total Breaches', value: data.totalBreaches, icon: AlertTriangle, color: 'text-amber-400' },
    ]

    return (
        <div className="space-y-8">
            {/* KPI — 2 Container Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Container 1: Account Stats */}
                <div className="bg-muted/10 border border-border/40 rounded-2xl p-5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4 block">Account Overview</span>
                    <div className="grid grid-cols-3 gap-4">
                        {accountStats.map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="flex items-center gap-2.5">
                                <Icon className={cn("h-4 w-4 shrink-0", color)} />
                                <div className="flex flex-col gap-0.5">
                                    <span className={cn("text-lg font-black font-mono leading-none", color)}>{value}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Container 2: Financials */}
                <div className="bg-muted/10 border border-border/40 rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Combined Net P&L</span>
                        <span className={cn("text-4xl font-black font-mono tracking-tighter", data.totalNetPnL >= 0 ? 'text-long' : 'text-short')}>
                            {data.totalNetPnL >= 0 ? '+' : ''}${data.totalNetPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-border/20">
                        <DollarSign className="h-4 w-4 shrink-0 text-primary" />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-lg font-black font-mono leading-none text-primary">${data.totalPayoutsReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Total Payouts</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Cards */}
            <div>
                <h2 className="text-[11px] uppercase tracking-[0.2em] font-black text-muted-foreground mb-4">All Accounts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.accounts.map(account => (
                        <AccountCard key={account.id} account={account} />
                    ))}
                </div>
            </div>
        </div>
    )
}
