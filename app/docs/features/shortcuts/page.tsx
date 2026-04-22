import { Keyboard, Search, Sparkles } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function ShortcutsDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Keyboard Shortcuts"
      description="The fastest navigation tool in the dashboard is the command palette, which centralizes navigation and actions such as opening quick add."
    >
      <DocsSection title="Primary shortcut">
        <DocsCardGrid>
          <DocsInfoCard
            icon={Search}
            title="Command palette"
            description="Use Ctrl/Cmd + K to open the command palette and jump to pages or trigger shell actions."
            items={['Navigation shortcuts live in one searchable place', 'Add New Trade launches the shared quick-add dialog', 'Palette behavior matches desktop shell conventions']}
          />
          <DocsInfoCard
            icon={Keyboard}
            title="Modal behavior"
            description="Dialogs, sheets, and popovers are designed to stay keyboard accessible with standard escape-to-close behavior where appropriate."
          />
          <DocsInfoCard
            icon={Sparkles}
            title="Use shortcuts for speed, not discovery"
            description="Shortcuts are best treated as a layer on top of the visible UI rather than the only way to reach core product actions."
          />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
