'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, lazy, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DataManagementCardSkeleton, DataPageSkeleton, DataTradeTableSkeleton } from "./components/data-page-skeleton"
import { PageHeader } from "@/components/ui/page-header"

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
          <PageHeader title="Data Management" className="gap-2" />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="rounded-2xl border border-border/18 bg-card/35 p-1">
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
          </TabsList>
          <TabsContent value="accounts" className="mt-6">
            <Suspense fallback={<DataManagementCardSkeleton />}>
              <DataManagementCard />
            </Suspense>
          </TabsContent>
          <TabsContent value="trades" className="mt-6">
            <Suspense fallback={<DataTradeTableSkeleton />}>
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
    <Suspense fallback={<DataPageSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
