import { Database, Group, Shield } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function DatabaseDocsPage() {
  return (
    <DocsPage
      badge="For Developers"
      title="Data Model Principles"
      description="Public developer docs describe the data domains and product rules at a conceptual level, without exposing raw schema dumps, migration history, or operator-only commands."
    >
      <DocsSection title="Key data domains">
        <DocsCardGrid>
          <DocsInfoCard icon={Group} title="Accounts and trades" description="Accounts and trade records power dashboard, reports, journal, and data-management flows." />
          <DocsInfoCard icon={Database} title="Review artifacts" description="Notes, screenshots, journal state, playbook references, and related metadata extend the core trade record into a review system." />
          <DocsInfoCard icon={Shield} title="Prop-firm state" description="Prop-firm tracking adds lifecycle-aware account state and supporting history without changing the broader product model." />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
