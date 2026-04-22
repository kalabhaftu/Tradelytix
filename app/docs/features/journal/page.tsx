import { BookOpen, ImageIcon, StickyNote } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function JournalDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Journal & Notes"
      description="The journal connects your trade history with written review. It surfaces day-level notes, journaled trading days, and trade cards that can include cropped preview images, screenshots, and trade context."
    >
      <DocsSection title="What the journal is for">
        <DocsCardGrid>
          <DocsInfoCard
            icon={BookOpen}
            title="Day-level review"
            description="Review a trading day with its P&L context, visible journal state, and the linked trades that happened on that date."
          />
          <DocsInfoCard
            icon={StickyNote}
            title="Trade notes"
            description="Trade edit flows support notes, tags, and related metadata so written review stays attached to the trade record."
          />
          <DocsInfoCard
            icon={ImageIcon}
            title="Visual context"
            description="Featured trade images now keep a saved preview crop so the journal card shows the framing the user chose instead of a generic center crop."
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="Calendar connection">
        <p>
          Journaled days surface through the calendar experience, and selecting a day can open a daily
          review modal that bridges trades, notes, and performance context.
        </p>
      </DocsSection>
    </DocsPage>
  )
}
