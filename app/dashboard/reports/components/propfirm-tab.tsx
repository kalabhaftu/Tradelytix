'use client'

import { Building2, CheckCircle2, Clock3, DollarSign, Target, Trophy, XCircle } from 'lucide-react'
import { usePropFirmStats } from '@/hooks/use-propfirm-stats'
import type { PropFirmAccountDTO, PropFirmSummaryDTO } from '@/lib/statistics/propfirm-statistics'
import { cn } from '@/lib/utils'
import { PropFirmReportsSkeleton } from './reports-page-skeleton'

function formatCurrency(value: number) {
  return `${value >= 0 ? '+' : '-'}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function lifecycleMeta(status: PropFirmAccountDTO['lifecycleStatus']) {
  switch (status) {
    case 'funded':
      return { label: 'Funded', className: 'border-primary/25 bg-primary/10 text-primary' }
    case 'active':
      return { label: 'Active', className: 'border-blue-400/25 bg-blue-400/10 text-blue-300' }
    case 'failed':
      return { label: 'Failed', className: 'border-short/25 bg-short/10 text-short' }
    case 'pending_approval':
      return { label: 'Pending Approval', className: 'border-amber-400/25 bg-amber-400/10 text-amber-300' }
    default:
      return { label: 'Passed', className: 'border-long/25 bg-long/10 text-long' }
  }
}

function OverviewStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: typeof Building2
  color: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={cn('h-4 w-4 shrink-0', color)} />
      <div className="flex flex-col gap-0.5">
        <span className={cn('text-lg font-black font-mono leading-none', color)}>{value}</span>
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">{label}</span>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: 'positive' | 'negative' | 'neutral'
}) {
  const color =
    tone === 'positive'
      ? 'text-long'
      : tone === 'negative'
        ? 'text-short'
        : 'text-foreground'

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] font-black uppercase tracking-[0.16em] text-muted-foreground/55">{label}</span>
      <span className={cn('text-[11px] font-black font-mono', color)}>{value}</span>
    </div>
  )
}

function AccountCard({ account }: { account: PropFirmAccountDTO }) {
  const status = lifecycleMeta(account.lifecycleStatus)

  return (
    <article className="rounded-2xl border border-border/40 bg-card p-5 transition-colors hover:border-border/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary/80">
            <Building2 className="h-3.5 w-3.5 text-primary/70" />
            <span className="truncate">{account.propFirmName}</span>
          </div>
          <div className="text-[13px] font-black uppercase tracking-tight text-foreground">
            {account.accountName}
          </div>
          <div className="text-[10px] font-semibold text-muted-foreground/65">
            {account.isFundedStage ? 'Funded Stage' : `Phase ${account.currentPhaseNumber ?? '-'}`} - $
            {account.accountSize.toLocaleString()}
          </div>
        </div>

        <span className={cn('shrink-0 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-widest', status.className)}>
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className={cn('text-3xl font-black font-mono tracking-tighter', account.netPnL >= 0 ? 'text-long' : 'text-short')}>
          {formatCurrency(account.netPnL)}
        </span>
        <span className="text-[9px] font-bold text-muted-foreground/55">Net P&L</span>
      </div>

      {account.profitTargetAmount > 0 && !account.isFundedStage && (
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/55">
              Profit Target Progress
            </span>
            <span className="text-[8px] font-black text-foreground/65">
              {account.profitTargetProgressPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted/30">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                account.grossPnL >= 0 ? 'bg-long' : 'bg-short'
              )}
              style={{ width: `${Math.min(100, Math.max(0, account.profitTargetProgressPct))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[8px] text-muted-foreground/45">
            <span>{formatCurrency(account.grossPnL)} gross</span>
            <span>${account.profitTargetAmount.toLocaleString()} target</span>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border/30 pt-4">
        <Metric label="Trades" value={account.tradeCount} />
        <Metric label="Active Days" value={account.activeDays} />
        <Metric label="Duration" value={`${account.durationDays}d`} />
        <Metric label="Win Rate" value={`${account.winRate}%`} tone={parseFloat(account.winRate) >= 50 ? 'positive' : 'negative'} />
        <Metric label="Profit Factor" value={account.profitFactor} tone={parseFloat(account.profitFactor) >= 1 ? 'positive' : 'negative'} />
        <Metric label="Expectancy" value={`$${account.expectancy}`} tone={parseFloat(account.expectancy) >= 0 ? 'positive' : 'negative'} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/30 pt-4">
        <Metric
          label="Peak Profit"
          value={`$${account.peakProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          tone="positive"
        />
        <Metric
          label="Max DD"
          value={`$${account.maxDrawdown.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${account.maxDrawdownPct}%)`}
          tone="negative"
        />
      </div>

      {(account.totalPayouts > 0 || account.breachCount > 0 || account.phaseHistory.length > 1) && (
        <div className="mt-4 space-y-3 border-t border-border/30 pt-4">
          {(account.totalPayouts > 0 || account.breachCount > 0) && (
            <div className="flex flex-wrap items-center gap-3">
              {account.totalPayouts > 0 && (
                <div className="flex items-center gap-1 text-[9px] font-black text-primary">
                  <DollarSign className="h-3 w-3" />
                  ${account.totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} payouts
                </div>
              )}
              {account.breachCount > 0 && (
                <div className="text-[9px] font-black text-amber-300">
                  {account.breachCount} breach{account.breachCount === 1 ? '' : 'es'}
                </div>
              )}
            </div>
          )}

          {account.phaseHistory.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {account.phaseHistory.map((phase) => (
                <span
                  key={phase.id}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                    phase.status === 'passed' && 'border-long/25 bg-long/10 text-long',
                    phase.status === 'failed' && 'border-short/25 bg-short/10 text-short',
                    phase.status === 'active' && 'border-blue-400/20 bg-blue-400/10 text-blue-300',
                    phase.status === 'pending_approval' && 'border-amber-400/20 bg-amber-400/10 text-amber-300',
                    !['passed', 'failed', 'active', 'pending_approval'].includes(phase.status) &&
                      'border-border/40 bg-muted/20 text-muted-foreground'
                  )}
                >
                  {phase.isFundedStage ? 'Funded' : `P${phase.phaseNumber}`} - {phase.status.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

interface PropFirmTabProps {
  initialData?: PropFirmSummaryDTO
}

export function PropFirmTab({ initialData }: PropFirmTabProps) {
  const { data, isLoading } = usePropFirmStats(initialData)

  if (isLoading) {
    return <PropFirmReportsSkeleton />
  }

  if (!data || data.accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/5 py-24">
        <Building2 className="mb-4 h-10 w-10 text-muted-foreground/30" />
        <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground/50">No Prop Firm Accounts</h3>
        <p className="text-[10px] font-medium text-muted-foreground/40">Import prop firm trades to see master-account analytics here</p>
      </div>
    )
  }

  const accountStats = [
    { label: 'Total Accounts', value: data.totalAccounts, icon: Building2, color: 'text-foreground' },
    { label: 'Active', value: data.activeAccounts, icon: Clock3, color: 'text-blue-300' },
    { label: 'Funded', value: data.fundedAccounts, icon: CheckCircle2, color: 'text-primary' },
    { label: 'Failed', value: data.failedAccounts, icon: XCircle, color: 'text-short' },
    { label: 'Passed Phases', value: data.passedPhases, icon: Trophy, color: 'text-long' },
    { label: 'Breaches', value: data.totalBreaches, icon: Target, color: 'text-amber-300' },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/40 bg-muted/10 p-5">
          <span className="mb-4 block text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Account Overview</span>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {accountStats.map(({ label, value, icon, color }) => (
              <OverviewStat key={label} label={label} value={value} icon={icon} color={color} />
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-border/40 bg-muted/10 p-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Combined Net P&L</span>
            <span className={cn('text-4xl font-black font-mono tracking-tighter', data.totalNetPnL >= 0 ? 'text-long' : 'text-short')}>
              {formatCurrency(data.totalNetPnL)}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/20 pt-4">
            <OverviewStat
              label="Gross Challenge P&L"
              value={formatCurrency(data.totalGrossPnL)}
              icon={Target}
              color={data.totalGrossPnL >= 0 ? 'text-long' : 'text-short'}
            />
            <OverviewStat
              label="Paid Payouts"
              value={`$${data.totalPayoutsReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={DollarSign}
              color="text-primary"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Master Accounts</h2>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data.accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </div>
    </div>
  )
}

