import { DocsCallout, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function FAQDocsPage() {
  return (
    <DocsPage
      badge="Resources"
      title="FAQ & Troubleshooting"
      description="Common questions about sign-in, imports, dashboard totals, and where to look when something feels off."
    >
      <DocsSection title="Is Deltalytix free?" className="scroll-mt-24" >
        <div id="is-deltalytix-free" />
        <p>
          Yes. Deltalytix is available as a free trading journal and analytics product. Donation
          support helps cover hosting and ongoing maintenance.
        </p>
      </DocsSection>

      <DocsSection title="What can I import?" className="scroll-mt-24">
        <div id="what-can-i-import" />
        <p>
          Use the import flow for supported trade exports and account data files. Always review the
          parsed result before saving so account mapping and field detection match your expectations.
        </p>
      </DocsSection>

      <DocsSection title="Where is my data stored?" className="scroll-mt-24">
        <div id="where-is-my-data-stored" />
        <p>
          Your product data is stored in the app backend and scoped to your account. Dashboard,
          journal, reports, and account views all read from the same underlying user-scoped data.
        </p>
      </DocsSection>

      <DocsSection title="Why does the dashboard look empty?" className="scroll-mt-24">
        <div id="why-does-the-dashboard-look-empty" />
        <ul>
          <li>Check your active account filters first.</li>
          <li>Confirm the date range includes imported trades.</li>
          <li>Verify the import completed and mapped into the expected account.</li>
          <li>Refresh dashboard data from the sidebar utility action if totals look stale.</li>
        </ul>
      </DocsSection>

      <DocsSection title="Why don’t trade totals match what I expected?">
        <p>
          Across the product, UI labels named <strong>Trades</strong> use grouped trade/execution
          counts rather than raw trade rows. If your dataset contains partial fills, grouped trade
          totals can be lower than raw imported rows.
        </p>
      </DocsSection>

      <DocsSection title="How do I delete my account?">
        <p>
          Open <strong>Settings</strong>, review the account actions section, and use the delete flow
          there if you want to permanently remove your account and stored data.
        </p>
      </DocsSection>

      <DocsCallout title="Still stuck?" tone="warning">
        If the issue depends on a specific account, filter state, or mobile/PWA flow, include those
        details in the feedback form so the problem can be reproduced faster.
      </DocsCallout>
    </DocsPage>
  )
}
