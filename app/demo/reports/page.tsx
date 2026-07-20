import ReportsPageClient from '@/app/dashboard/reports/reports-page-client'
import { getMockReportStats } from '@/lib/demo/mock-data'

export default function DemoReportsPage() {
  return (
    <ReportsPageClient
      initialReportData={getMockReportStats()}
      initialPropFirmData={null}
    />
  )
}
