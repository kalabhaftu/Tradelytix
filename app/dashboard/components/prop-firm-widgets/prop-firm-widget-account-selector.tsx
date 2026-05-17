"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DashboardPropFirmAccountOption } from '@/hooks/use-dashboard-prop-firm-account'

type Props = {
  accounts: DashboardPropFirmAccountOption[]
  selectedMasterAccountId: string | null
  onChange: (value: string) => void
  isLoading?: boolean
  className?: string
}

function getLabel(account: DashboardPropFirmAccountOption) {
  const phase = account.currentPhase ? `Phase ${account.currentPhase}` : 'No current phase'
  return `${account.accountName || account.propFirmName} · ${phase}`
}

export function PropFirmWidgetAccountSelector({ accounts, selectedMasterAccountId, onChange, isLoading, className }: Props) {
  if (isLoading) {
    return <div className="h-8 w-44 animate-pulse rounded-lg bg-muted/30" />
  }

  if (accounts.length === 0) {
    return <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No prop firm accounts</span>
  }

  if (accounts.length === 1) {
    return (
      <span className="max-w-[15rem] truncate rounded-lg border border-border/40 bg-muted/20 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {getLabel(accounts[0])}
      </span>
    )
  }

  return (
    <Select value={selectedMasterAccountId || undefined} onValueChange={onChange}>
      <SelectTrigger className={cn('h-8 w-[15rem] rounded-lg border-border/40 bg-muted/15 text-xs', className)}>
        <SelectValue placeholder="Choose challenge" />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {getLabel(account)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
