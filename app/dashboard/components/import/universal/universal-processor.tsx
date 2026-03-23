'use client'

import React, { useEffect, useMemo, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trade } from '@/prisma/generated/prisma/browser'
import { useI18n } from '@/locales/client'
import { 
  processUniversalCSV, 
  SUPPORTED_PLATFORMS,
  type ProcessingResult 
} from '@/lib/csv/universal-csv-processor'
import { PlatformProcessorProps } from '../config/platforms'
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const formatDuration = (seconds: number): string => {
  if (seconds === 0) return '0s'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`)
  
  return parts.join(' ')
}

export default function UniversalProcessor({ 
  headers, 
  csvData, 
  processedTrades, 
  setProcessedTrades 
}: PlatformProcessorProps) {
  const t = useI18n()
  
  const [processingResult, setProcessingResult] = React.useState<ProcessingResult | null>(null)
  const [showFieldMapping, setShowFieldMapping] = React.useState(false)

  const processTrades = useCallback(() => {
    const result = processUniversalCSV(headers, csvData, {
      fallbackTimezone: 'America/New_York',
      skipEmptyRows: true,
      requirePnl: false
    })
    
    setProcessingResult(result)
    setProcessedTrades(result.trades as Trade[])
  }, [csvData, headers, setProcessedTrades])

  useEffect(() => {
    processTrades()
  }, [processTrades])

  const totalPnL = useMemo(() => 
    processedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0), 
    [processedTrades]
  )
  
  const totalCommission = useMemo(() => 
    processedTrades.reduce((sum, trade) => sum + (trade.commission || 0), 0), 
    [processedTrades]
  )
  
  const uniqueInstruments = useMemo(() => 
    Array.from(new Set(processedTrades.map(trade => trade.instrument))), 
    [processedTrades]
  )

  if (!processingResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <Card className="h-full flex flex-col w-full overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b shrink-0 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Universal CSV Processor</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Auto-detected: <Badge variant="secondary" className="ml-1">{processingResult.detectedPlatform || 'Unknown'}</Badge>
          </CardDescription>
        </div>
        
        {/* Processing Status */}
        <div className="flex items-center gap-2">
          {processingResult.success ? (
            <Badge variant="default" className="bg-long/20 text-long border border-long/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {processingResult.stats.processedRows} trades processed
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Processing failed
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 overflow-auto p-0">
        <div className="flex flex-col h-full">
          
          {/* Warnings & Errors */}
          {(processingResult.warnings.length > 0 || processingResult.errors.length > 0) && (
            <div className="p-4 space-y-2 border-b">
              {processingResult.errors.map((error, idx) => (
                <div key={`error-${idx}`} className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error.message}</span>
                </div>
              ))}
              {processingResult.warnings.slice(0, 3).map((warning, idx) => (
                <div key={`warning-${idx}`} className="flex items-start gap-2 text-sm text-amber-600 bg-amber-500/10 p-2 rounded">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{warning.message}</span>
                </div>
              ))}
              {processingResult.warnings.length > 3 && (
                <p className="text-xs text-muted-foreground pl-6">
                  +{processingResult.warnings.length - 3} more warnings
                </p>
              )}
            </div>
          )}

          {/* Field Mapping Info */}
          <Collapsible open={showFieldMapping} onOpenChange={setShowFieldMapping}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 px-4 py-2 rounded-none border-b">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="text-xs">Field Mapping</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {Object.values(processingResult.mappedFields).filter(Boolean).length} / {Object.keys(processingResult.mappedFields).length}
                </Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 bg-muted/30 border-b">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                  {Object.entries(processingResult.mappedFields).map(([field, header]) => (
                    <div key={field} className="flex items-center gap-1.5">
                      {header ? (
                        <CheckCircle2 className="h-3 w-3 text-long shrink-0" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-muted-foreground/30 shrink-0" />
                      )}
                      <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-muted-foreground truncate">
                        {header || 'Not found'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Trades Table */}
          {processedTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
              <h3 className="font-semibold text-lg mb-1">No Trades Found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Could not extract any valid trades from the CSV. Please ensure your file contains 
                the required columns (Symbol/Instrument, Entry Date) and try again.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <Table className="w-full border-separate border-spacing-0">
                <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs">
                  <TableRow>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">Instrument</TableHead>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">Side</TableHead>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">Qty</TableHead>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">Entry</TableHead>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">Exit</TableHead>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">Entry Date</TableHead>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">Exit Date</TableHead>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">P&L</TableHead>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">Duration</TableHead>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">Commission</TableHead>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">SL</TableHead>
                    <TableHead className="whitespace-nowrap px-3 py-2 text-xs font-semibold">TP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedTrades.map((trade) => (
                    <TableRow 
                      key={trade.id}
                      className="border-b border-border/50 transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm font-medium">
                        {trade.instrument}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm">
                        <Badge 
                          variant="outline" 
                          className={trade.side === 'long' ? 'border-long/50 text-long' : 'border-short/50 text-short'}
                        >
                          {trade.side || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm">
                        {trade.quantity || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm">
                        {trade.entryPrice || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm">
                        {trade.closePrice || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm text-muted-foreground">
                        {trade.entryDate ? new Date(trade.entryDate).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm text-muted-foreground">
                        {trade.closeDate ? new Date(trade.closeDate).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className={`whitespace-nowrap px-3 py-2 text-sm font-semibold ${
                        trade.pnl && trade.pnl >= 0 ? 'text-long' : 'text-short'
                      }`}>
                        {trade.pnl !== undefined ? `$${trade.pnl.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm text-muted-foreground">
                        {formatDuration(trade.timeInPosition || 0)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm text-muted-foreground">
                        {trade.commission ? `$${Math.abs(trade.commission).toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm text-muted-foreground">
                        {trade.stopLoss || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm text-muted-foreground">
                        {trade.takeProfit || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t bg-background px-4 py-3 shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Total P&L</p>
            <p className={`text-lg font-bold ${totalPnL >= 0 ? 'text-long' : 'text-short'}`}>
              ${totalPnL.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Commission</p>
            <p className="text-lg font-bold text-muted-foreground">
              ${Math.abs(totalCommission).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Net P&L</p>
            <p className={`text-lg font-bold ${(totalPnL + totalCommission) >= 0 ? 'text-long' : 'text-short'}`}>
              ${(totalPnL + totalCommission).toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Instruments:</span>
          <div className="flex flex-wrap gap-1">
            {uniqueInstruments.slice(0, 5).map((instrument) => (
              <Badge key={instrument} variant="outline" className="text-xs">
                {instrument}
              </Badge>
            ))}
            {uniqueInstruments.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{uniqueInstruments.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * Info panel component showing supported platforms
 */
export function UniversalProcessorInfo() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Universal CSV Import</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automatically detects and processes CSV files from any trading platform.
          </p>
        </div>
      </div>
      
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Supported Platforms
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORTED_PLATFORMS.map(platform => (
            <Badge key={platform} variant="secondary" className="text-xs">
              {platform}
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="pt-2 border-t">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Required Fields
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-long" />
            Symbol/Instrument (asset name)
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-long" />
            Entry Date/Time (trade open timestamp)
          </li>
        </ul>
        
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-3">
          Optional Fields
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>P&L, Entry/Exit Price, Side, Quantity, Stop Loss, Take Profit, Commission, Duration</li>
        </ul>
      </div>
      
      <div className="pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          <Info className="h-3 w-3 inline mr-1" />
          The processor automatically maps column headers to fields. If your CSV uses non-standard headers, 
          use the CSV-AI option for manual column mapping.
        </p>
      </div>
    </div>
  )
}
