import { Boxes, LayoutTemplate, Network } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function ArchitectureDocsPage() {
  return (
    <DocsPage
      badge="For Developers"
      title="Architecture"
      description="Tradelytix is organized around a few stable product systems: public support surfaces, an authenticated dashboard shell, shared UI primitives, and server-owned analytics/data flows."
    >
      <DocsSection title="Main architectural layers">
        <DocsCardGrid>
          <DocsInfoCard
            icon={Boxes}
            title="Public support layer"
            description="Landing, docs, feedback, and donation pages form the public-facing layer and should share a coherent shell."
          />
          <DocsInfoCard
            icon={LayoutTemplate}
            title="Authenticated app shell"
            description="Dashboard navigation, filters, command palette, quick-add flows, and sidebar behavior belong to one shared product shell."
          />
          <DocsInfoCard
            icon={Network}
            title="Server-owned analytics"
            description="Dashboard, reports, accounts, and journal depend on shared server-side data shaping so counts and summaries stay aligned."
          />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
