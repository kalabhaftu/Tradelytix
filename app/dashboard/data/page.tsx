'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, lazy, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DataRouteSkeleton, TablePanelSkeleton } from "@/components/ui/non-dashboard-skeletons"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

// Lazy load heavy components
const TradeTable = lazy(() => import("@/app/dashboard/data/components/data-management/trade-table"))
const DataManagementCard = lazy(() => import("@/app/dashboard/data/components/data-management/data-management-card").then(mod => ({ default: mod.DataManagementCard })))

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'accounts'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleTabChange = useCallback((value: string) => {
    router.push(`/dashboard/data?tab=${value}`)
  }, [router])

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Data Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your trading accounts and trades</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
          </TabsList>
          <TabsContent value="accounts" className="mt-6">
            <Suspense fallback={<TablePanelSkeleton rows={6} />}>
              <DataManagementCard />
            </Suspense>
          </TabsContent>
          <TabsContent value="trades" className="mt-6">
            <Suspense fallback={<TablePanelSkeleton rows={8} />}>
              <TradeTable />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DataRouteSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
