import { BarChart3, NotebookPen, ShieldCheck } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function TradezellaComparisonDocsPage() {
  return (
    <DocsPage
      badge="For Developers"
      title="Product Positioning Comparison"
      description="This page keeps the comparison high level. It describes where Tradelytix differentiates in workflow emphasis without making unsupported claims about external products."
    >
      <DocsSection title="Current positioning">
        <DocsCardGrid>
          <DocsInfoCard icon={BarChart3} title="Analytics-first review" description="Tradelytix leans heavily into dashboard, widget, calendar, and filter-aware performance review." />
          <DocsInfoCard icon={NotebookPen} title="Journal-connected workflow" description="Trade review, journaling, screenshots, and notes are intended to work as one loop rather than as isolated pages." />
          <DocsInfoCard icon={ShieldCheck} title="Prop-firm awareness" description="A meaningful part of the product is dedicated to prop-firm lifecycle tracking and challenge-style analysis." />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
