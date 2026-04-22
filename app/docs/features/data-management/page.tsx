import { Database, RefreshCw, Table2 } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function DataManagementDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Data Management"
      description="The data page is the maintenance surface for accounts and trades when you need to inspect or manage the underlying records beyond the dashboard."
    >
      <DocsSection title="Tabs and purpose">
        <DocsCardGrid>
          <DocsInfoCard
            icon={Database}
            title="Accounts tab"
            description="Review account-level state and maintenance actions from a dedicated account management surface."
          />
          <DocsInfoCard
            icon={Table2}
            title="Trades tab"
            description="Inspect and manage imported trade records in a more operational table view."
          />
          <DocsInfoCard
            icon={RefreshCw}
            title="Refresh vs manage"
            description="The sidebar refresh action updates live dashboard data, while the data page is where you should go for structured account/trade maintenance."
          />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
