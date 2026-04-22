import { DatabaseZap, Gauge, Layers3 } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function PrismaOptimizationDocsPage() {
  return (
    <DocsPage
      badge="For Developers"
      title="Prisma Optimization"
      description="This section covers optimization principles, not private operational recipes. The main goal is to keep analytics and review surfaces fast without duplicating business logic across the stack."
    >
      <DocsSection title="Optimization themes">
        <DocsCardGrid>
          <DocsInfoCard icon={Layers3} title="Server-side aggregation" description="Compute analytics close to the data source when product counts and summaries need to stay aligned across multiple surfaces." />
          <DocsInfoCard icon={Gauge} title="Read-heavy performance" description="Optimize for the dashboard and reporting paths that are hit frequently, especially under filter changes and larger histories." />
          <DocsInfoCard icon={DatabaseZap} title="Intentional query shape" description="Prefer predictable query ownership and reusable aggregation helpers over many slightly different endpoint-specific calculations." />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
