import { FlaskConical, NotebookTabs, Target } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function BacktestingDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Backtesting"
      description="Backtesting supports structured strategy review away from live execution, helping traders compare ideas, scenarios, and outcome patterns before applying them in production."
    >
      <DocsSection title="Backtesting purpose">
        <DocsCardGrid>
          <DocsInfoCard
            icon={FlaskConical}
            title="Strategy rehearsal"
            description="Use backtesting to log and compare repeatable patterns before turning them into live execution rules."
          />
          <DocsInfoCard
            icon={NotebookTabs}
            title="Structured review"
            description="Backtesting entries can support notes, classification, and historical review instead of becoming a loose archive of screenshots."
          />
          <DocsInfoCard
            icon={Target}
            title="Bridge to playbook"
            description="The strongest workflow is to connect backtesting observations to the playbook and then carry those lessons into real trade review."
          />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
