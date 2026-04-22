import { Bot, Link2, Palette, User } from 'lucide-react'

import { DocsCardGrid, DocsInfoCard, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function SettingsDocsPage() {
  return (
    <DocsPage
      badge="Feature Guide"
      title="Settings"
      description="Settings control profile information, display preferences, time-related behavior, linked accounts, AI preferences, and account-level actions."
    >
      <DocsSection title="What you can configure">
        <DocsCardGrid>
          <DocsInfoCard
            icon={User}
            title="Profile"
            description="Update first and last name, review your account email, and manage profile details through an explicit edit flow."
          />
          <DocsInfoCard
            icon={Palette}
            title="Preferences"
            description="Theme, accent pack, timezone, time format, and break-even threshold all live in settings."
          />
          <DocsInfoCard
            icon={Bot}
            title="AI preferences"
            description="Control whether AI review features are enabled for the parts of the product that support them."
          />
          <DocsInfoCard
            icon={Link2}
            title="Linked accounts and account actions"
            description="Manage linked login providers, data management access, sign-out, and account deletion in one place."
          />
        </DocsCardGrid>
      </DocsSection>

      <DocsSection title="Layout notes">
        <p>
          The settings screen is organized as intentional sections instead of a brittle equal-height
          two-column grid, so cards can grow naturally without leaving awkward dead space between
          unrelated sections.
        </p>
      </DocsSection>
    </DocsPage>
  )
}
