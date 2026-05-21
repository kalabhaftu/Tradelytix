import { Filter, Images, PencilLine } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function TradeTableDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Trade Table"
      description="The trade table is the detailed record view for your executions. It is the fastest place to inspect grouped trades, edit notes and media, and compare records under the active filter set."
    >
      <DocsSection title="Core behaviors">
        <DocsCardGrid>
          <DocsInfoCard
            icon={Filter}
            title="Filter-aware trade history"
            description="The table respects the active account and date context so detailed records line up with dashboard and report views."
          />
          <DocsInfoCard
            icon={PencilLine}
            title="Editing"
            description="Trade editing is built to preserve visible form values while saving so notes and images do not disappear during in-flight updates."
          />
          <DocsInfoCard
            icon={Images}
            title="Media handling"
            description="Trades can carry screenshots and a featured preview image. The preview image uses saved framing for journal and card-style surfaces, while galleries can still show the raw image."
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="Trade counts">
        <p>
          Where the UI says <strong>Trades</strong>, Tradelytix uses grouped trade/execution counts.
          Raw imported rows are considered a lower-level data detail rather than the primary product
          count shown in normal analytics surfaces.
        </p>
      </DocsSection>
    </DocsPage>
  )
}
