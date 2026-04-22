import { Database, ShieldCheck, Workflow } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function BackendDocsPage() {
  return (
    <DocsPage
      badge="For Developers"
      title="Backend Structure"
      description="Backend documentation here stays product-focused: request boundaries, ownership patterns, and data-safety expectations rather than raw internal implementation details."
    >
      <DocsSection title="Backend responsibilities">
        <DocsCardGrid>
          <DocsInfoCard
            icon={Workflow}
            title="Server-side ownership"
            description="Filtering, aggregation, auth-aware routing, and dashboard/report calculations are primarily server responsibilities."
          />
          <DocsInfoCard
            icon={ShieldCheck}
            title="User isolation"
            description="User-scoped access is a core invariant. Product data flows are designed so one user’s data never leaks into another user’s surface."
          />
          <DocsInfoCard
            icon={Database}
            title="Product data flows"
            description="Trades, accounts, journal entries, prop-firm state, and settings all connect through a shared application data layer rather than isolated feature silos."
          />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
