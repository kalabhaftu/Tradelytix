import { BookCopy, Tags, Target } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function PlaybookDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Playbook & Models"
      description="The playbook is where traders organize setups, models, and review language so trade history can be interpreted against a repeatable framework."
    >
      <DocsSection title="What belongs here">
        <DocsCardGrid>
          <DocsInfoCard
            icon={Target}
            title="Setups and rules"
            description="Use the playbook to define what counts as a setup, what rules matter, and what criteria should be reviewed consistently."
          />
          <DocsInfoCard
            icon={Tags}
            title="Shared labels"
            description="Tags, model selections, and related labeling help the rest of the app group trades meaningfully."
          />
          <DocsInfoCard
            icon={BookCopy}
            title="Review reference"
            description="Playbook content becomes the reference layer behind trade review rather than a disconnected notes page."
          />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
