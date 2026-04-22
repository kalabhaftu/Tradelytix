import {
  Activity,
  ArrowRight,
  BookOpen,
  Database,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Shield,
  Target,
  Upload,
  Users,
} from 'lucide-react'

import {
  DocsCardGrid,
  DocsInfoCard,
  DocsLinkList,
  DocsPage,
  DocsSection,
} from '@/components/docs/docs-page'

export default function DocsHome() {
  return (
    <DocsPage
      badge="Documentation"
      title="Deltalytix Knowledge Base"
      description="Use these guides to get started, understand the product surface, and navigate the parts of Deltalytix you actually use day to day."
    >
      <DocsSection
        title="Start here"
        description="If you are new to the app, begin with the onboarding path below before diving into feature-specific references."
      >
        <DocsLinkList
          links={[
            {
              href: '/docs/getting-started',
              label: 'Quick Start',
              description: 'Sign in, import data, review your dashboard, and verify your first setup.',
            },
            {
              href: '/docs/features/app-flow',
              label: 'Application Flow',
              description: 'Understand how public pages, auth, dashboard pages, and support flows connect.',
            },
            {
              href: '/docs/faq',
              label: 'FAQ & Troubleshooting',
              description: 'Find the current answers for common product questions and support issues.',
            },
            {
              href: '/docs/feedback',
              label: 'Feedback Guide',
              description: 'See the fastest way to report bugs, request features, or send product notes.',
            },
          ]}
        />
      </DocsSection>

      <DocsSection
        title="Core product areas"
        description="These pages reflect the current dashboard shell and the tools available inside the authenticated app."
      >
        <DocsCardGrid className="lg:grid-cols-3">
          <DocsInfoCard
            icon={Upload}
            title="Trade import"
            description="Bring trades in, review parsing results, and keep account history current."
            items={['Upload broker exports or supported trade files', 'Review parsing before committing changes', 'Use the data page for account and trade maintenance']}
          />
          <DocsInfoCard
            icon={LayoutDashboard}
            title="Dashboard and widgets"
            description="Track performance through KPI cards, charts, templates, filters, and calendar views."
            items={['Responsive KPI layouts', 'Filter-aware widgets and reports', 'Edit mode, templates, and widget customization']}
          />
          <DocsInfoCard
            icon={BookOpen}
            title="Journal and trade review"
            description="Annotate trading days, add notes and screenshots, and review trades in context."
            items={['Daily journal flow', 'Trade notes and image previews', 'Calendar-to-day review modal']}
          />
          <DocsInfoCard
            icon={Users}
            title="Accounts"
            description="Manage live and prop-firm accounts with filter-aware reporting and current lifecycle states."
            items={['Live account tracking', 'Prop-firm master account progress', 'Account filters across dashboard and reports']}
          />
          <DocsInfoCard
            icon={Target}
            title="Playbook and backtesting"
            description="Keep a structured library of setups, models, and simulated review work."
            items={['Setup and rule organization', 'Backtesting workflow', 'Strategy-oriented review notes']}
          />
          <DocsInfoCard
            icon={Settings}
            title="Settings and data"
            description="Adjust profile, time, theme, linked accounts, AI preferences, and account data tooling."
            items={['Profile and account preferences', 'Theme and time controls', 'Linked accounts and data management']}
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection
        title="Reference paths"
        description="Use these when you want a direct pointer to the exact area you need."
      >
        <DocsLinkList
          links={[
            {
              href: '/docs/features/dashboard',
              label: 'Dashboard reference',
              description: 'KPIs, widget editing, filters, templates, and calendar behavior.',
            },
            {
              href: '/docs/features/accounts',
              label: 'Accounts reference',
              description: 'Live account tracking, prop-firm account states, and filter usage.',
            },
            {
              href: '/docs/features/settings',
              label: 'Settings reference',
              description: 'Profile, preferences, linked accounts, and account actions.',
            },
            {
              href: '/docs/donate',
              label: 'Support the project',
              description: 'Donation options and non-code ways to support Deltalytix.',
            },
          ]}
        />
      </DocsSection>

      <DocsSection
        title="Developer notes"
        description="The public developer section stays high level by design. It explains the product architecture and ownership boundaries without exposing internal-only operational detail."
      >
        <DocsCardGrid>
          <DocsInfoCard
            icon={Shield}
            title="Safe by default"
            description="Developer docs focus on concepts, responsibilities, and extension points instead of secrets, raw schema dumps, or maintenance commands."
          />
          <DocsInfoCard
            icon={Database}
            title="Product-aware references"
            description="Architecture, backend, and data pages are written to support onboarding and contribution planning without mirroring private infrastructure documentation."
          />
        </DocsCardGrid>
      </DocsSection>
    </DocsPage>
  )
}
