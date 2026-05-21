import { Building2, Flag, Shield, TrendingUp } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function PropFirmDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Prop Firm Tracking"
      description="Tradelytix tracks prop-firm accounts at the master-account level so reporting reflects the real lifecycle of an evaluation instead of treating every historical phase like an active account."
    >
      <DocsSection title="Tracking model">
        <DocsCardGrid>
          <DocsInfoCard
            icon={Building2}
            title="Master account centric"
            description="Funded/prop-firm reporting is built around the current state of each master account, with phase history kept as supporting detail."
          />
          <DocsInfoCard
            icon={Flag}
            title="Lifecycle states"
            description="Accounts resolve into meaningful states such as active, funded, failed, passed, or pending approval based on the current tradable phase."
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="Performance interpretation">
        <DocsCardGrid>
          <DocsInfoCard
            icon={TrendingUp}
            title="Challenge progress"
            description="Profit-target progress for challenge-style tracking is based on gross progress, while realized performance views can still show net values where appropriate."
          />
          <DocsInfoCard
            icon={Shield}
            title="Rule awareness"
            description="Prop-firm pages are built to help users reason about status, phases, drawdown context, and account progression without mixing historical passed phases into active-account counts."
          />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
