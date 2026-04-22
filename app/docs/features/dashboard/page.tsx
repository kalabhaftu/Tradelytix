import { BarChart3, CalendarDays, LayoutDashboard, SlidersHorizontal } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function DashboardDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Dashboard"
      description="The dashboard is the primary analytics workspace. It combines KPI cards, chart widgets, filters, templates, and calendar views into one configurable surface."
    >
      <DocsSection title="What lives on the dashboard">
        <DocsCardGrid>
          <DocsInfoCard
            icon={LayoutDashboard}
            title="KPI row"
            description="Top-line performance cards summarize the current filtered state."
            items={['Grouped trade counts are canonical', 'KPI layouts adapt by viewport', 'Card internals scale down for narrow screens']}
          />
          <DocsInfoCard
            icon={BarChart3}
            title="Analytics widgets"
            description="Charts and summary cards reflect the same active filters as the rest of the dashboard."
            items={['Equity, drawdown, distribution, and instrument views', 'Performance summaries stay filter-aware', 'Dense layouts rebalance on smaller widths']}
          />
          <DocsInfoCard
            icon={CalendarDays}
            title="Calendar widgets"
            description="The advanced calendar and compact calendar views connect daily P&L, journal presence, and day-level review."
          />
          <DocsInfoCard
            icon={SlidersHorizontal}
            title="Templates and edit mode"
            description="You can switch templates, enter edit mode, rearrange widgets, and save dashboard layouts for different review styles."
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="Filters and counts">
        <ul>
          <li>Dashboard totals follow the active account and date filters.</li>
          <li>Widgets labeled <strong>Trades</strong> use grouped execution counts rather than raw rows.</li>
          <li>Reports, journal, and dashboard should agree when they share the same filter set.</li>
        </ul>
      </DocsSection>
    </DocsPage>
  )
}
