'use client'

import { useState } from 'react'
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, CalendarDays as CalendarIcon, TrendingUp, Brain, AlertTriangle, Target, Lightbulb, Flame, Crosshair, ShieldAlert, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { cn, cleanContent } from '@/lib/utils'

import { CustomDateRangePicker } from '@/components/ui/custom-date-range-picker'

interface DateRangeTemplate {
  id: string
  label: string
  getValue: () => { from: Date; to: Date }
}

const dateRangeTemplates: DateRangeTemplate[] = [
  {
    id: 'last-7-days',
    label: 'Last 7 Days',
    getValue: () => ({
      from: subDays(new Date(), 7),
      to: new Date()
    })
  },
  {
    id: 'last-30-days',
    label: 'Last 30 Days',
    getValue: () => ({
      from: subDays(new Date(), 30),
      to: new Date()
    })
  },
  {
    id: 'this-week',
    label: 'This Week',
    getValue: () => ({
      from: startOfWeek(new Date()),
      to: endOfWeek(new Date())
    })
  },
  {
    id: 'this-month',
    label: 'This Month',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    })
  },
  {
    id: 'last-month',
    label: 'Last Month',
    getValue: () => {
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth)
      }
    }
  }
]

interface AIAnalysisDialogProps {
  isOpen: boolean
  onClose: () => void
  accountId?: string | null
}

interface AnalysisResult {
  summary: string
  emotionalPatterns: string[]
  performanceInsights: string[]
  recommendations: string[]
  strengths: string[]
  weaknesses: string[]
}

export function AIAnalysisDialog({ isOpen, onClose, accountId }: AIAnalysisDialogProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  })
  const [tempDateRange, setTempDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  const handleTemplateSelect = (template: DateRangeTemplate) => {
    setDateRange(template.getValue())
    setAnalysis(null) // Clear previous analysis
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)

    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
      })

      if (accountId) {
        params.append('accountId', accountId)
      }

      const response = await fetch(`/api/journal/ai-analysis?${params}`)

      if (!response.ok) {
        throw new Error('Failed to generate analysis')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      toast.success('Analysis complete!')
    } catch (error) {
      toast.error('Failed to generate AI analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatDateRange = () => {
    return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Crosshair className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Trading Performance Audit</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Brutally honest analysis of your trading patterns, psychology, and execution. No sugarcoating.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="space-y-6">
            {/* Date Range Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Date Range</label>

              {/* Templates */}
              <div className="flex flex-wrap gap-2">
                {dateRangeTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect(template)}
                    className="text-xs"
                  >
                    {template.label}
                  </Button>
                ))}

                <Popover
                  open={showCustomDatePicker}
                  onOpenChange={(open) => {
                    setShowCustomDatePicker(open)
                    if (open) {
                      setTempDateRange(dateRange)
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs gap-2">
                      <CalendarIcon className="h-3 w-3" />
                      Custom Range
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CustomDateRangePicker
                      selected={tempDateRange}
                      onSelect={(range) => {
                        // Always update the temp range to show progress
                        setTempDateRange({
                          from: range?.from,
                          to: range?.to
                        })

                        // Only commit and close if we have a full range
                        if (range?.from && range?.to) {
                          setDateRange({ from: range.from, to: range.to })
                          setAnalysis(null)
                          setShowCustomDatePicker(false)
                        }
                      }}
                      className="w-fit"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selected Range Display */}
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{formatDateRange()}</span>
              </div>
            </div>

            {/* Analysis Results */}
            {analysis ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Summary - The Verdict */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Flame className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          The Verdict
                          <Badge variant="outline" className="text-xs font-normal">Bottom Line</Badge>
                        </h3>
                        <p className="text-sm leading-relaxed">
                          {cleanContent(analysis.summary)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Emotional Patterns - Psychology Leaks */}
                {analysis.emotionalPatterns.length > 0 && (
                  <Card className="border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Brain className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="space-y-2 flex-1">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            Psychology Patterns
                            <Badge variant="outline" className="text-xs font-normal border-blue-500/30 text-blue-400">Mental Game</Badge>
                          </h3>
                          <ul className="space-y-2.5">
                            {analysis.emotionalPatterns.map((pattern, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <ShieldAlert className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                                <span className="flex-1">{cleanContent(pattern)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Performance Insights - P&L Leaks */}
                {analysis.performanceInsights.length > 0 && (
                  <Card className="border-amber-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                          <Target className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="space-y-2 flex-1">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            Data Insights
                            <Badge variant="outline" className="text-xs font-normal border-amber-500/30 text-amber-400">Numbers</Badge>
                          </h3>
                          <ul className="space-y-2.5">
                            {analysis.performanceInsights.map((insight, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <TrendingUp className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                <span className="flex-1">{cleanContent(insight)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.strengths.length > 0 && (
                    <Card className="border-long/20">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Badge className="text-xs bg-long/20 text-long border border-long/30">What&apos;s Working</Badge>
                          </h3>
                          <ul className="space-y-2">
                            {analysis.strengths.map((strength, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <span className="text-long font-bold">+</span>
                                <span className="flex-1">{cleanContent(strength)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.weaknesses.length > 0 && (
                    <Card className="border-short/20">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">Problems to Fix</Badge>
                          </h3>
                          <ul className="space-y-2">
                            {analysis.weaknesses.map((weakness, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-short mt-0.5 shrink-0" />
                                <span className="flex-1">{cleanContent(weakness)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Recommendations - Action Plan */}
                {analysis.recommendations.length > 0 && (
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-3 flex-1">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            Action Plan
                            <Badge variant="outline" className="text-xs font-normal">Do These Now</Badge>
                          </h3>
                          <ol className="space-y-3">
                            {analysis.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm flex items-start gap-3">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                                  {index + 1}
                                </span>
                                <span className="flex-1 pt-0.5">{cleanContent(rec)}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <div className="text-center space-y-4 max-w-md">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Crosshair className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-semibold">Ready for the Truth?</p>
                    <p className="text-sm text-muted-foreground">
                      This analysis will tell you what you need to hear, not what you want to hear. 
                      Select a date range and prepare for an honest assessment of your trading.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      P&L Patterns
                    </span>
                    <span className="flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      Psychology Leaks
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Execution Gaps
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t shrink-0 bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={onClose} disabled={isAnalyzing}>
              Close
            </Button>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="font-medium">
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Auditing Your Trading...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Performance Audit
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
