import { CheckCircle2, Import, LayoutDashboard, Settings, BookOpenText, Filter } from 'lucide-react'

import { DocsCallout, DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function GettingStartedDocsPage() {
  return (
    <DocsPage
      badge="Getting Started"
      title="Quick Start"
      description="This guide walks through the first setup that matters: signing in, importing trades, checking filters, and confirming that your dashboard is reading the right data."
    >
      <DocsSection title="1. Sign in and reach the app shell">
        <p>
          Sign in from the home page and let the app restore your session into the dashboard. If you
          install the app as a PWA, reopening it should return you to the app flow instead of leaving
          you at the public landing page.
        </p>
      </DocsSection>

      <DocsSection title="2. Import your first data">
        <DocsCardGrid>
          <DocsInfoCard
            icon={Import}
            title="Import trades"
            description="Use the import flow from the dashboard navbar to upload a broker export or supported trade file."
            items={['Review mapped values before saving', 'Confirm the destination account', 'Use the data page later for account/trade maintenance']}
          />
          <DocsInfoCard
            icon={Filter}
            title="Check account filters"
            description="Make sure the selected account set matches what you expect before judging dashboard or report totals."
            items={['Account filters affect dashboard, reports, and journal views', 'Grouped trade counts are the canonical “Trades” value', 'Changing account filters updates visible performance totals']}
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="3. Review the dashboard">
        <DocsCardGrid>
          <DocsInfoCard
            icon={LayoutDashboard}
            title="Start with KPIs and charts"
            description="The dashboard is the main performance review space, with responsive KPI rows, charts, and calendars."
            items={['KPI cards summarize current filtered performance', 'Widgets share the active filter scope', 'Templates let you keep multiple dashboard arrangements']}
          />
          <DocsInfoCard
            icon={BookOpenText}
            title="Open journal and trade review"
            description="Use the journal and trade table after import to confirm screenshots, notes, and grouped trades look correct."
            items={['Journal cards reflect saved preview crops', 'Trade editing keeps notes/images visible while saving', 'Daily review flows connect through the calendar']}
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="4. Set your preferences">
        <p>
          Visit settings to review timezone, time format, theme, break-even threshold, linked
          accounts, and profile details. These values affect how data is grouped and how outcomes are
          classified across the app.
        </p>
      </DocsSection>

      <DocsCallout title="First-run checklist" tone="success">
        <ul>
          <li>Sign in and confirm you land in the dashboard.</li>
          <li>Import at least one account or trade file.</li>
          <li>Check active account filters before comparing totals.</li>
          <li>Open journal, reports, and settings once so your core flows are verified.</li>
        </ul>
      </DocsCallout>
    </DocsPage>
  )
}
