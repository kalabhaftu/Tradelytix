import { LayoutDashboard, MousePointer2, Smartphone } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function FrontendDocsPage() {
  return (
    <DocsPage
      badge="For Developers"
      title="Frontend Guidelines"
      description="Frontend work in Tradelytix should preserve product hierarchy, shell consistency, and the responsive behavior expected across dashboard, public pages, and support flows."
    >
      <DocsSection title="Frontend priorities">
        <DocsCardGrid>
          <DocsInfoCard
            icon={LayoutDashboard}
            title="Shell consistency"
            description="Shared shell systems such as sidebars, navbars, dialogs, and public headers should be treated as reusable product primitives rather than page-specific hacks."
          />
          <DocsInfoCard
            icon={Smartphone}
            title="Responsive behavior"
            description="Mobile, tablet, narrow desktop, and wide desktop should be handled intentionally instead of compressing the widest layout down until it breaks."
          />
          <DocsInfoCard
            icon={MousePointer2}
            title="Interaction quality"
            description="Editing, saving, command-palette actions, popovers, and sheets should keep visible context stable and predictable."
          />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
