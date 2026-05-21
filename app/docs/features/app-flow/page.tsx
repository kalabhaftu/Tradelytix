import { ArrowRight, BookOpen, LayoutDashboard, MessageSquare, Shield } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function AppFlowDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Application Flow"
      description="Tradelytix has two major surfaces: the public support/docs experience and the authenticated trading workspace. This page explains how users move between them."
    >
      <DocsSection title="Public surface">
        <p>
          Public pages include the landing/sign-in page, documentation, feedback, and donation flows.
          They share a common header and a smart primary action that either signs the user in or sends
          them back into the dashboard when a session already exists.
        </p>
      </DocsSection>

      <DocsSection title="Authenticated workspace">
        <DocsCardGrid>
          <DocsInfoCard
            icon={LayoutDashboard}
            title="Dashboard shell"
            description="After authentication, users work inside the dashboard shell with a persistent sidebar, navbar actions, filters, and quick-add flows."
            items={['Dashboard', 'Reports', 'Trades', 'Journal', 'Playbook', 'Accounts', 'Backtesting', 'Data', 'Settings']}
          />
          <DocsInfoCard
            icon={BookOpen}
            title="Review loop"
            description="A typical review path is import → dashboard → journal/trade table → reports → settings adjustments."
            items={['Filters stay in sync across major analytics views', 'Calendar day selection opens detailed day review', 'Command palette and quick-add support fast navigation']}
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="Support loop">
        <DocsCardGrid>
          <DocsInfoCard
            icon={MessageSquare}
            title="Feedback flow"
            description="Users can send product feedback from the public feedback page or from the dashboard utility navigation."
          />
          <DocsInfoCard
            icon={Shield}
            title="Session restoration"
            description="Cold opens, especially in installed-app mode, should restore the user into the app flow instead of forcing a fresh sign-in every time."
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="Routing expectations">
        <ul>
          <li>Public CTA when signed out: <strong>Sign In</strong></li>
          <li>Public CTA when signed in: <strong>Back to App</strong></li>
          <li>Primary authenticated destination: <code>/dashboard</code></li>
          <li>Support pages remain public and do not require an account</li>
        </ul>
      </DocsSection>
    </DocsPage>
  )
}
