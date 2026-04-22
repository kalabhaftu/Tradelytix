import { Building2, Filter, Users } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function AccountsDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Accounts"
      description="The accounts area covers both live trading accounts and prop-firm account tracking. It is designed for filter-aware review rather than raw database inspection."
    >
      <DocsSection title="Account types">
        <DocsCardGrid>
          <DocsInfoCard
            icon={Users}
            title="Live accounts"
            description="Use live accounts for regular broker or trading-account history that feeds dashboard, reports, and journal review."
          />
          <DocsInfoCard
            icon={Building2}
            title="Prop-firm accounts"
            description="Prop-firm tracking is master-account based, with lifecycle-aware reporting and phase history used as supporting detail."
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="How counts behave">
        <DocsCardGrid>
          <DocsInfoCard
            icon={Filter}
            title="Filter-aware totals"
            description="Page totals and account summaries are intended to reflect the displayed filter set rather than a hidden global number."
          />
          <DocsInfoCard
            icon={Users}
            title="Grouped trade math"
            description="Counts exposed as “Trades” are grouped execution counts, not raw imported rows."
          />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
