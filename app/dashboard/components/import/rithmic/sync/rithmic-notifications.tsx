'use client'

import { useEffect, useState } from 'react'
import { useRithmicSyncStore } from '@/store/rithmic-sync-store'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Info, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useNotificationStore } from '@/store/notification'
import { useRithmicSyncContext } from '@/context/rithmic-sync-context'

interface Notification {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message: string
  timestamp: number
  progress?: {
    current: number
    total: number
    ordersProcessed: number
    currentDate?: string | undefined
    currentDayNumber?: number | undefined
  } | undefined
}

function formatYYYYMMDD(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr
  const year = dateStr.slice(0, 4)
  const month = dateStr.slice(4, 6)
  const day = dateStr.slice(6, 8)
  return `${day}/${month}/${year}`
}

export function RithmicSyncNotifications() {
  const [notifications, setNotifications] = useState<Record<string, Notification>>({
    progress: {
      id: 'progress',
      type: 'info',
      title: 'Rithmic Ingestion',
      message: 'No active ingestion running',
      timestamp: Date.now(),
      progress: {
        current: 0,
        total: 0,
        ordersProcessed: 0
      }
    }
  })
  const [isComplete, setIsComplete] = useState(false)
  const { isCollapsed, setIsCollapsed } = useNotificationStore()
  const { isConnected } = useRithmicSyncContext()
  const { lastMessage, accountsProgress, currentAccount, selectedAccounts, processingStats } = useRithmicSyncStore()

  useEffect(() => {
    if (isConnected) {
      setIsComplete(false)
    }
  }, [isConnected])

  useEffect(() => {
    if (currentAccount && accountsProgress[currentAccount]) {
      const progress = accountsProgress[currentAccount]
      setNotifications(prev => ({
        ...prev,
        progress: {
          ...prev.progress!,
          type: 'info',
          message: `Processing account ${currentAccount}...`,
          timestamp: Date.now(),
          progress: {
            current: progress.daysProcessed,
            total: progress.totalDays,
            ordersProcessed: progress.ordersProcessed,
            currentDate: progress.currentDate,
            currentDayNumber: progress.currentDayNumber
          }
        }
      }))
    } else {
      setNotifications(prev => ({
        ...prev,
        progress: {
          ...prev.progress!,
          message: 'No active ingestion running',
          timestamp: Date.now(),
          progress: {
            current: 0,
            total: 0,
            ordersProcessed: 0
          }
        }
      }))
    }
  }, [currentAccount, accountsProgress])

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'status' || lastMessage.type === 'processing_complete') {
        if (lastMessage.all_complete || lastMessage.type === 'processing_complete') {
          setIsComplete(true)
          setNotifications(prev => ({
            ...prev,
            progress: {
              ...prev.progress!,
              type: 'success',
              message: 'Rithmic ingestion completed successfully',
              timestamp: Date.now()
            }
          }))
        }
      } else if (lastMessage.type === 'log' && lastMessage.level === 'info') {
        const processingMatch = lastMessage.message.match(/Processing date (\d+) of (\d+): (\d+)/)
        if (processingMatch) {
          const [_, current, total, date] = processingMatch
          setNotifications(prev => ({
            ...prev,
            progress: {
              ...prev.progress!,
              type: 'info',
              message: `Processing date ${formatYYYYMMDD(date)}...`,
              timestamp: Date.now(),
              progress: {
                current: parseInt(current),
                total: parseInt(total),
                ordersProcessed: prev.progress?.progress?.ordersProcessed || 0,
                currentDate: date,
                currentDayNumber: parseInt(current)
              }
            }
          }))
        }
      } else if (lastMessage.type === 'order_update') {
        setNotifications(prev => ({
          ...prev,
          progress: {
            ...prev.progress!,
            timestamp: Date.now(),
            progress: {
              ...prev.progress!.progress!,
              ordersProcessed: (prev.progress?.progress?.ordersProcessed || 0) + 1,
              current: prev.progress?.progress?.current || 0,
              total: prev.progress?.progress?.total || 0
            }
          }
        }))
      } else if (lastMessage.type === 'progress') {
        const progressMatch = lastMessage.message.match(/\[(.*?)\] Processing date (\d+)\/(\d+)(?:: (\d{8}))?/)
        if (progressMatch) {
          const [, accountId, current, total, date] = progressMatch
          setNotifications(prev => ({
            ...prev,
            progress: {
              ...prev.progress!,
              type: 'info',
              message: `Processing account ${accountId}...`,
              timestamp: Date.now(),
              progress: {
                current: parseInt(current),
                total: parseInt(total),
                ordersProcessed: prev.progress?.progress?.ordersProcessed || 0,
                currentDate: date,
                currentDayNumber: parseInt(current)
              }
            }
          }))
        }
      }
    }
  }, [lastMessage])

  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      setNotifications(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(key => {
          const notif = updated[key]
          if (!notif) return
          if ((notif.timestamp || 0) < fiveMinutesAgo) {
            updated[key] = {
              ...notif,
              id: notif.id || key,
              type: 'info',
              message: 'No active ingestion running',
              progress: {
                current: 0,
                total: 0,
                ordersProcessed: 0
              }
            } as Notification
          }
        })
        return updated
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isComplete || notifications.progress?.message === 'No active ingestion running') {
    return null
  }

  const progress = notifications.progress?.progress
  const totalAccountsToProcess = selectedAccounts.length || processingStats.totalAccountsAvailable || 1
  const currentAccountIndex = currentAccount ? selectedAccounts.indexOf(currentAccount) + 1 : 0
  
  const completedAccountsProgress = Math.max(0, currentAccountIndex - 1) * 100
  const currentAccountProgress = progress ? (progress.current / progress.total) * 100 : 0
  const progressPercentage = totalAccountsToProcess > 0 
    ? (completedAccountsProgress + currentAccountProgress) / totalAccountsToProcess 
    : 0

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      <Alert
        key={notifications.progress?.id || 'progress'}
        className={cn(
          notifications.progress?.type === 'success' && "border-green-500",
          isCollapsed && "w-16 h-16 p-0 ml-auto"
        )}
      >
        <div className={cn("flex items-start gap-2", isCollapsed && "justify-center items-center h-full")}>
          {isCollapsed ? (
            <div 
              className="relative w-12 h-12 cursor-pointer" 
              onClick={() => setIsCollapsed(false)}
              title="Expand"
            >
              <svg className="w-12 h-12 -rotate-90">
                <circle
                  className="text-muted-foreground/20"
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="transparent"
                  r="20"
                  cx="24"
                  cy="24"
                />
                <circle
                  className="text-primary"
                  strokeWidth="2"
                  strokeDasharray={125.6}
                  strokeDashoffset={Math.max(0, 125.6 - (125.6 * (progressPercentage || 0)) / 100)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="20"
                  cx="24"
                  cy="24"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          ) : (
            <>
              {notifications.progress?.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {notifications.progress?.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <AlertTitle>Rithmic Ingestion</AlertTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsCollapsed(true)}
                      title="Collapse"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <AlertDescription>
                  <div>{notifications.progress?.message}</div>
                  {progress && progress.total > 0 && (
                    <div className="mt-2 space-y-2">
                      <Progress 
                        value={progressPercentage} 
                        className="w-full h-2" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Days: {progress.current} / {progress.total}</span>
                        <span>Account: {currentAccountIndex} / {totalAccountsToProcess}</span>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </>
          )}
        </div>
      </Alert>
    </div>
  )
}
