'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trophy,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WeeklyAIReview {
  id: string
  weekStart: string
  weekEnd: string
  summary: string
  highlights: string[]
  lowlights: string[]
  stats: {
    totalTrades: number
    winRate: number
    totalPnl: number
    profitFactor: number
    wins: number
    losses: number
    avgWin: number
    avgLoss: number
    bestDay: { day: string; pnl: number; trades: number } | null
    worstDay: { day: string; pnl: number; trades: number } | null
    avgTradesPerDay: number
    tradingDays: number
    maxWinStreak: number
    maxLossStreak: number
    instruments: { name: string; pnl: number; trades: number; winRate: number }[]
  }
  grade: string
  focusNextWeek: string | null
  createdAt: string
}

interface WeeklyReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewId?: string
}

const gradeColors: Record<string, string> = {
  'A+': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'A': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'B+': 'bg-green-500/15 text-green-400 border-green-500/25',
  'B': 'bg-green-500/10 text-green-400 border-green-500/20',
  'C+': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  'C': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'D': 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  'F': 'bg-red-500/15 text-red-400 border-red-500/25',
}

export function WeeklyReviewDialog({ open, onOpenChange, reviewId }: WeeklyReviewDialogProps) {
  const [reviews, setReviews] = useState<WeeklyAIReview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    const fetchReviews = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/v1/weekly-review?limit=20')
        const result = await res.json()
        if (result.success && result.data) {
          const reviewList = Array.isArray(result.data) ? result.data : [result.data]
          setReviews(reviewList.filter(Boolean))

          // If a specific reviewId was requested, find its index
          if (reviewId) {
            const idx = reviewList.findIndex((r: WeeklyAIReview) => r.id === reviewId)
            setCurrentIndex(idx >= 0 ? idx : 0)
          } else {
            setCurrentIndex(0)
          }
        }
      } catch {
        // Silent error
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [open, reviewId])

  const review = reviews[currentIndex]
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < reviews.length - 1

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !review ? (
          <div className="flex flex-col items-center justify-center p-16 text-muted-foreground">
            <BarChart3 className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">No weekly reviews yet.</p>
            <p className="text-xs mt-1">Reviews are generated automatically each weekend.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5" />
                    Weekly Performance Review
                  </DialogTitle>
                  {review.grade && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xl font-bold px-4 py-1 border',
                        gradeColors[review.grade] || 'bg-muted text-muted-foreground'
                      )}
                    >
                      {review.grade}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="flex items-center gap-1.5 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(review.weekStart), 'MMM d')} – {format(new Date(review.weekEnd), 'MMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="max-h-[calc(85vh-140px)]">
              <div className="px-6 pb-6 space-y-5">
                {/* Key Stats Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <StatCard
                    label="Trades"
                    value={String(review.stats.totalTrades)}
                    sub={`${review.stats.tradingDays} days`}
                  />
                  <StatCard
                    label="Win Rate"
                    value={`${review.stats.winRate}%`}
                    sub={`${review.stats.wins}W / ${review.stats.losses}L`}
                    color={review.stats.winRate >= 50 ? 'text-long' : 'text-short'}
                  />
                  <StatCard
                    label="P&L"
                    value={`$${review.stats.totalPnl.toLocaleString()}`}
                    color={review.stats.totalPnl >= 0 ? 'text-long' : 'text-short'}
                  />
                  <StatCard
                    label="Profit Factor"
                    value={review.stats.profitFactor >= 999 ? '∞' : String(review.stats.profitFactor)}
                    color={review.stats.profitFactor >= 1.5 ? 'text-long' : review.stats.profitFactor >= 1 ? 'text-muted-foreground' : 'text-short'}
                  />
                </div>

                {/* Summary */}
                <div>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {review.summary}
                  </p>
                </div>

                <Separator />

                {/* Highlights */}
                {review.highlights && review.highlights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2.5">
                      <TrendingUp className="h-4 w-4 text-long" />
                      What Went Well
                    </h4>
                    <ul className="space-y-2">
                      {review.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                          <Trophy className="h-3.5 w-3.5 text-long mt-0.5 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Lowlights */}
                {review.lowlights && review.lowlights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2.5">
                      <TrendingDown className="h-4 w-4 text-short" />
                      What Needs Work
                    </h4>
                    <ul className="space-y-2">
                      {review.lowlights.map((l, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                          <AlertTriangle className="h-3.5 w-3.5 text-short mt-0.5 shrink-0" />
                          {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Focus Next Week */}
                {review.focusNextWeek && (
                  <>
                    <Separator />
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        Focus Next Week
                      </h4>
                      <p className="text-sm text-foreground/80">{review.focusNextWeek}</p>
                    </div>
                  </>
                )}

                {/* Instruments breakdown */}
                {review.stats.instruments && review.stats.instruments.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2.5">Instruments</h4>
                      <div className="space-y-1.5">
                        {review.stats.instruments.map((inst) => (
                          <div key={inst.name} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{inst.name}</span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{inst.trades} trades</span>
                              <span>{inst.winRate}% WR</span>
                              <span className={cn(
                                'font-medium',
                                inst.pnl >= 0 ? 'text-long' : 'text-short'
                              )}>
                                ${inst.pnl.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Navigation Footer */}
            {reviews.length > 1 && (
              <div className="border-t px-6 py-3 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex(i => i + 1)}
                  disabled={!canGoNext}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Older
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1} of {reviews.length} reports
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex(i => i - 1)}
                  disabled={!canGoPrev}
                >
                  Newer
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-lg font-bold', color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}
