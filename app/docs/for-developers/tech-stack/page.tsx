import { Code2, Database, Globe, Layers3 } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function TechStackDocsPage() {
  return (
    <DocsPage
      badge="For Developers"
      title="Tech Stack"
      description="This page describes the product stack at a high level so contributors can understand the moving pieces without exposing private infrastructure or operational-only details."
    >
      <DocsSection title="Core layers">
        <DocsCardGrid>
          <DocsInfoCard icon={Globe} title="App framework" description="Tradelytix is built on Next.js with an app-router architecture and a server-first product shell." />
          <DocsInfoCard icon={Code2} title="UI layer" description="React, shared UI primitives, and dashboard-specific components drive the authenticated workspace and public support pages." />
          <DocsInfoCard icon={Database} title="Data layer" description="A relational data model backs accounts, trades, journal content, settings, and prop-firm tracking." />
          <DocsInfoCard icon={Layers3} title="Product systems" description="The main product systems are dashboard analytics, trade review, journaling, account tracking, backtesting, and support/docs flows." />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
