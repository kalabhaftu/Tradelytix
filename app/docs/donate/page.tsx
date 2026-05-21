import Link from 'next/link'

import { DocsCallout, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function DonateGuideDocsPage() {
  return (
    <DocsPage
      badge="Resources"
      title="Support the Project"
      description="Tradelytix stays free to use. If you want to support hosting, maintenance, and continued product work, the donation page lists the current wallet options."
    >
      <DocsSection title="How to donate">
        <ol>
          <li>Open the <Link href="/donate">donation page</Link>.</li>
          <li>Choose the wallet/network you want to use.</li>
          <li>Copy the address and send from your preferred wallet.</li>
        </ol>
      </DocsSection>

      <DocsSection title="What support helps with">
        <ul>
          <li>Hosting and database costs</li>
          <li>Storage and operational overhead</li>
          <li>Maintenance, fixes, and ongoing product improvement</li>
        </ul>
      </DocsSection>

      <DocsSection title="Other ways to help">
        <ul>
          <li>Send high-quality feedback</li>
          <li>Share the product with other traders</li>
          <li>Contribute documentation or code if you are part of the contributor community</li>
        </ul>
      </DocsSection>

      <DocsCallout title="Keep it simple">
        The donation page is intentionally lightweight: it lists supported wallets, lets you copy an
        address quickly, and keeps the support flow clear without turning it into a marketing page.
      </DocsCallout>
    </DocsPage>
  )
}
