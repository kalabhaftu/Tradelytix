import { Grip, LayoutGrid, Save } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function WidgetsDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Widget Customization"
      description="Dashboard widgets can be rearranged and resized so users can keep different analytical layouts without losing the wide-desktop structure or smaller-screen responsiveness."
    >
      <DocsSection title="Customization flow">
        <DocsCardGrid>
          <DocsInfoCard
            icon={LayoutGrid}
            title="Edit mode"
            description="Enter dashboard edit mode to change the current widget layout."
          />
          <DocsInfoCard
            icon={Grip}
            title="Move and resize"
            description="Drag widgets, resize them where supported, and rebalance the layout without affecting the canonical data underneath."
          />
          <DocsInfoCard
            icon={Save}
            title="Templates"
            description="Save layouts as dashboard templates so different review modes can be recalled quickly."
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="Responsive behavior">
        <p>
          Widget layouts are tiered for wide desktop, narrow desktop, tablet, and mobile so the
          dashboard remains readable instead of compressing the desktop composition blindly.
        </p>
      </DocsSection>
    </DocsPage>
  )
}
