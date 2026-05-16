import { cn } from '@/lib/utils'

export const modalShell = {
  sm: 'w-[calc(100vw-1.25rem)] max-w-[28rem] sm:max-w-[28rem] rounded-2xl border border-border/60 bg-background p-0 shadow-xl',
  md: 'w-[calc(100vw-1.25rem)] max-w-[36rem] sm:max-w-[36rem] rounded-2xl border border-border/60 bg-background p-0 shadow-xl',
  lg: 'w-[calc(100vw-1.25rem)] max-w-[48rem] sm:max-w-[48rem] rounded-[24px] border border-border/60 bg-background p-0 shadow-xl',
  xl: 'w-[calc(100vw-1.25rem)] max-w-[64rem] sm:max-w-[64rem] rounded-[28px] border border-border/60 bg-background p-0 shadow-xl',
  form: 'w-[calc(100vw-1.25rem)] max-w-[42rem] sm:max-w-[42rem] rounded-[24px] border border-border/60 bg-background p-0 shadow-xl',
  wizard: 'w-[calc(100vw-1.25rem)] max-w-[56rem] sm:max-w-[56rem] max-h-[min(90dvh,56rem)] overflow-hidden rounded-[28px] border border-border/60 bg-background p-0 shadow-xl',
  dataTable: 'w-[calc(100vw-1.25rem)] max-w-[72rem] sm:max-w-[72rem] max-h-[min(90dvh,60rem)] overflow-hidden rounded-[28px] border border-border/60 bg-background p-0 shadow-xl',
  fullscreen: 'w-[calc(100vw-1rem)] max-w-[96rem] sm:max-w-[96rem] h-[min(94dvh,72rem)] rounded-[28px] border border-border/60 bg-background p-0 shadow-xl',
}

export const dashboardModalShell = {
  daily: 'w-[calc(100vw-1.5rem)] max-w-[60rem] sm:max-w-[60rem] rounded-[28px] border border-border/60 p-0 overflow-hidden bg-background shadow-xl',
  analysis: 'w-[calc(100vw-1.5rem)] max-w-[64rem] sm:max-w-[64rem] h-[min(88dvh,54rem)] rounded-[28px] border border-border/60 p-0 overflow-hidden bg-background shadow-xl',
  weekly: 'w-[calc(100vw-1.5rem)] max-w-[68rem] sm:max-w-[68rem] h-[min(90dvh,60rem)] rounded-[28px] border border-border/60 p-0 overflow-hidden bg-background shadow-xl',
}

export function getModalShellClass(variant: keyof typeof modalShell, className?: string) {
  return cn(modalShell[variant], className)
}
