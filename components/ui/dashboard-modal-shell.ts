import { cn } from '@/lib/utils'

export const modalShell = {
  sm: 'w-[min(100vw-1.25rem,28rem)] max-w-none rounded-2xl border border-border/60 bg-background p-0 shadow-xl',
  md: 'w-[min(100vw-1.25rem,36rem)] max-w-none rounded-2xl border border-border/60 bg-background p-0 shadow-xl',
  lg: 'w-[min(100vw-1.25rem,48rem)] max-w-none rounded-[24px] border border-border/60 bg-background p-0 shadow-xl',
  xl: 'w-[min(100vw-1.25rem,64rem)] max-w-none rounded-[28px] border border-border/60 bg-background p-0 shadow-xl',
  form: 'w-[min(100vw-1.25rem,42rem)] max-w-none rounded-[24px] border border-border/60 bg-background p-0 shadow-xl',
  wizard: 'w-[min(100vw-1.25rem,56rem)] max-w-none max-h-[min(90dvh,56rem)] overflow-hidden rounded-[28px] border border-border/60 bg-background p-0 shadow-xl',
  dataTable: 'w-[min(100vw-1.25rem,72rem)] max-w-none max-h-[min(90dvh,60rem)] overflow-hidden rounded-[28px] border border-border/60 bg-background p-0 shadow-xl',
  fullscreen: 'w-[min(100vw-1rem,96rem)] max-w-none h-[min(94dvh,72rem)] rounded-[28px] border border-border/60 bg-background p-0 shadow-xl',
}

export const dashboardModalShell = {
  daily: 'w-[min(100vw-1.25rem,68rem)] max-w-none rounded-[28px] border border-border/60 p-0 overflow-hidden bg-background shadow-xl',
  analysis: 'w-[min(100vw-1.25rem,82rem)] max-w-none h-[min(90dvh,58rem)] rounded-[28px] border border-border/60 p-0 overflow-hidden bg-background shadow-xl',
  weekly: 'w-[min(100vw-1.25rem,110rem)] max-w-none h-[min(92dvh,72rem)] rounded-[28px] border border-border/60 p-0 overflow-hidden bg-background shadow-xl',
}

export function getModalShellClass(variant: keyof typeof modalShell, className?: string) {
  return cn(modalShell[variant], className)
}
