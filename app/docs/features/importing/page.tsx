import { FileUp, ShieldCheck, Users } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function ImportingDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Trade Import"
      description="The import flow is the main way to bring broker or platform trade history into Tradelytix without re-entering trades manually."
    >
      <DocsSection title="What the import flow does">
        <DocsCardGrid>
          <DocsInfoCard
            icon={FileUp}
            title="Parse uploaded files"
            description="The importer reads supported export files and prepares trade records before anything is committed."
            items={['Review parsed data before saving', 'Map the import to the correct account', 'Confirm dates, instruments, and P&L fields']}
          />
          <DocsInfoCard
            icon={Users}
            title="Attach data to accounts"
            description="Imported trades should land in the correct live or prop-firm account context so dashboard and report filters work properly."
          />
          <DocsInfoCard
            icon={ShieldCheck}
            title="Protect review quality"
            description="Import is only the first step. After saving, check dashboard totals, journal cards, and the trade table to confirm the result matches your expectation."
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="After import">
        <ul>
          <li>Verify active account filters before reading totals.</li>
          <li>Open the trade table to confirm grouped trades and screenshots/notes behavior.</li>
          <li>Use the data page when you need account-level cleanup or trade maintenance.</li>
        </ul>
      </DocsSection>
    </DocsPage>
  )
}
