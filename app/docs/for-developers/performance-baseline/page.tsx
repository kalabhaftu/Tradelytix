import { Activity, BarChart3, Timer } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function PerformanceBaselineDocsPage() {
  return (
    <DocsPage
      badge="For Developers"
      title="Performance Baseline"
      description="Performance work should preserve the product’s interactive feel across dashboard analytics, support flows, settings, and mobile/PWA usage."
    >
      <DocsSection title="What matters most">
        <DocsCardGrid>
          <DocsInfoCard icon={BarChart3} title="Dashboard responsiveness" description="Filters, dashboard loads, and key report surfaces should remain responsive under realistic user data volumes." />
          <DocsInfoCard icon={Timer} title="Fast transitions" description="Navigation, overlays, and shell actions should feel immediate, especially in the authenticated workspace." />
          <DocsInfoCard icon={Activity} title="Stable interaction states" description="Loading and saving flows should preserve visible context instead of clearing content and rebuilding from scratch." />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
