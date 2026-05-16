"use client"

import { useState, useCallback, type ComponentType } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Target, Plus, Trash2, CheckCircle2, TrendingUp, Trophy, DollarSign, Flame, BarChart2, TrendingDown, Star } from "lucide-react"
import { GoalsPageSkeleton } from "./components/goals-page-skeleton"

type GoalMetric = "pnl" | "winRate" | "trades" | "streak" | "drawdown" | "custom"
type GoalPeriod = "daily" | "weekly" | "monthly" | "all-time"

interface Goal {
  id: string
  title: string
  description?: string
  metric: GoalMetric
  targetValue: number
  currentValue: number
  period: GoalPeriod
  startDate: string
  endDate?: string
  isCompleted: boolean
  completedAt?: string
  createdAt: string
}

const METRIC_LABELS: Record<GoalMetric, string> = {
  pnl: "Net P&L ($)",
  winRate: "Win Rate (%)",
  trades: "Trade Count",
  streak: "Win Streak",
  drawdown: "Max Drawdown (%)",
  custom: "Custom",
}

const METRIC_ICONS: Record<GoalMetric, ComponentType<{ className?: string }>> = {
  pnl: DollarSign,
  winRate: Target,
  trades: BarChart2,
  streak: Flame,
  drawdown: TrendingDown,
  custom: Star,
}

async function fetchGoals(): Promise<{ goals: Goal[] }> {
  const res = await fetch('/api/v1/goals')
  if (!res.ok) throw new Error('Failed to fetch goals')
  return res.json()
}

async function createGoal(data: Partial<Goal>): Promise<{ goal: Goal }> {
  const res = await fetch('/api/v1/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create goal')
  return res.json()
}

async function deleteGoal(id: string): Promise<void> {
  const res = await fetch(`/api/v1/goals/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete goal')
}

function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: (id: string) => void }) {
  const progressPct = Math.min((goal.currentValue / goal.targetValue) * 100, 100)
  const MetricIcon = METRIC_ICONS[goal.metric as GoalMetric]

  return (
    <div className={cn(
      "rounded-[24px] border bg-card/50 p-5 space-y-4 transition-all",
      goal.isCompleted
        ? "border-long/30 bg-long/5"
        : "border-border/20 hover:border-border/40"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <MetricIcon className="h-4 w-4 text-muted-foreground" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">{goal.title}</p>
            {goal.description && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{goal.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {goal.isCompleted && <CheckCircle2 className="h-4 w-4 text-long" />}
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider border-border/20">
            {goal.period}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-30 hover:opacity-100 hover:text-short"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-bold">{METRIC_LABELS[goal.metric as GoalMetric]}</span>
          <span className={cn("font-black font-mono", goal.isCompleted ? "text-long" : "text-foreground")}>
            {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}
          </span>
        </div>
        <Progress
          value={progressPct}
          className="h-1.5"
        />
        <p className="text-[9px] text-muted-foreground/40 font-bold">
          {progressPct.toFixed(0)}% complete
          {goal.endDate && ` · Ends ${new Date(goal.endDate).toLocaleDateString()}`}
        </p>
      </div>
    </div>
  )
}

function EmptyGoals() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-border/30 bg-card/20 py-24 gap-4">
      <Trophy className="h-12 w-12 text-muted-foreground/20" />
      <div className="text-center">
        <p className="text-sm font-bold text-muted-foreground/50 uppercase tracking-widest">No goals yet</p>
        <p className="text-xs text-muted-foreground/30 mt-1">Create your first trading goal to get started</p>
      </div>
    </div>
  )
}

export function GoalsPageClient() {
  const qc = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    metric: 'pnl' as GoalMetric,
    targetValue: '',
    period: 'monthly' as GoalPeriod,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  })

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      setIsCreateOpen(false)
      setForm({
        title: '',
        description: '',
        metric: 'pnl',
        targetValue: '',
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      })
      toast.success('Goal created')
    },
    onError: () => toast.error('Failed to create goal'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Goal deleted')
    },
    onError: () => toast.error('Failed to delete goal'),
  })

  const goals = data?.goals || []
  const active = goals.filter(g => !g.isCompleted)
  const completed = goals.filter(g => g.isCompleted)

  const handleCreate = useCallback(() => {
    if (!form.title || !form.targetValue) {
      toast.error('Title and target value are required')
      return
    }
    createMutation.mutate({
      ...form,
      targetValue: parseFloat(form.targetValue),
      endDate: form.endDate || undefined,
    })
  }, [form, createMutation])

  if (isLoading) {
    return <GoalsPageSkeleton />
  }

  return (
    <div className="flex flex-col gap-8 p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Goals"
        meta="Track progress towards your trading objectives"
        actions={
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Goal
          </Button>
        }
      />

      {goals.length === 0 ? (
        <EmptyGoals />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5" />
                Active ({active.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map(g => (
                  <GoalCard key={g.id} goal={g} onDelete={id => deleteMutation.mutate(id)} />
                ))}
              </div>
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-long" />
                Completed ({completed.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completed.map(g => (
                  <GoalCard key={g.id} goal={g} onDelete={id => deleteMutation.mutate(id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Create New Goal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Title</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Achieve 60% win rate this month"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Description (optional)</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Additional context..."
                className="min-h-[60px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Metric</Label>
                <Select value={form.metric} onValueChange={v => setForm(f => ({ ...f, metric: v as GoalMetric }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(METRIC_LABELS).map(([k, v]) => {
                      const ItemIcon = METRIC_ICONS[k as GoalMetric]
                      return (
                        <SelectItem key={k} value={k}>
                          <span className="flex items-center gap-1.5">
                            <ItemIcon className="h-3.5 w-3.5" />
                            {v}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Period</Label>
                <Select value={form.period} onValueChange={v => setForm(f => ({ ...f, period: v as GoalPeriod }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="all-time">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Target Value</Label>
              <Input
                type="number"
                step="any"
                value={form.targetValue}
                onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                placeholder="e.g. 60"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">End Date (optional)</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
