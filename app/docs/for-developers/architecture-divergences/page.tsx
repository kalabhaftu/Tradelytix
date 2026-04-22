import { GitBranch, ShieldCheck, Workflow } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function ArchitectureDivergencesDocsPage() {
  return (
    <DocsPage
      badge="For Developers"
      title="Architecture Divergences"
      description="This page documents product-level divergence patterns at a safe level: where a subsystem owns behavior for good reasons, and why forcing everything through one abstraction can hurt the UX."
    >
      <DocsSection title="Typical divergence patterns">
        <DocsCardGrid>
          <DocsInfoCard icon={Workflow} title="Dashboard-specific aggregation" description="The dashboard can own bespoke data shaping when that is necessary to keep widget behavior, templates, and filters consistent." />
          <DocsInfoCard icon={GitBranch} title="Shell-specific interaction rules" description="Mobile drawers, command palette flows, and public support pages may need dedicated layout logic instead of pretending one component shape fits every surface." />
          <DocsInfoCard icon={ShieldCheck} title="Safe public docs boundary" description="Developer-facing explanations should stop at conceptual ownership and avoid leaking internal-only operational detail." />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
