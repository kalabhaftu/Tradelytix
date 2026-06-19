import Link from 'next/link'
import { DocsCallout, DocsPage, DocsSection } from '@/components/docs/docs-page'

export default function FeedbackGuideDocsPage() {
  return (
    <DocsPage
      badge="Resources"
      title="Feedback Guide"
      description="Use feedback when you want to report a bug, request a feature, or flag something that feels broken or misleading in the product."
    >
      <DocsSection title="Where to send feedback">
        <ul>
          <li>
            <strong>Public page:</strong> <Link href="/feedback">/feedback</Link>
          </li>
          <li>
            <strong>Inside the app:</strong> the dashboard sidebar includes a direct Feedback entry
          </li>
        </ul>
      </DocsSection>

      <DocsSection title="What helps us review it quickly">
        <ul>
          <li>Feature name or page where the issue occurred</li>
          <li>What you expected to happen vs. what actually happened</li>
          <li>Active filters, selected accounts, or mobile/PWA context when relevant</li>
          <li>Screenshots or exported files if the issue is visual or import-related</li>
        </ul>
      </DocsSection>

      <DocsSection title="Best use cases">
        <ul>
          <li>Broken dashboard totals or filter behavior</li>
          <li>Trade edit or journal issues</li>
          <li>Import mapping problems</li>
          <li>Responsive/mobile layout problems</li>
          <li>Feature requests and usability suggestions</li>
        </ul>
      </DocsSection>

      <DocsSection title="How to get faster responses">
        <ul>
          <li>Include the account context that was active (account set, symbol, date range)</li>
          <li>Describe the filter state when the issue appeared</li>
          <li>Share your device type, browser, and screen size for layout issues</li>
          <li>Attach a screenshot or screen recording for visual bugs</li>
        </ul>
      </DocsSection>

      <DocsCallout title="Tip" tone="success">
        If the issue depends on one account, one symbol, one date range, or one device width, mention
        that directly in the message. It cuts down reproduction time a lot.
      </DocsCallout>
    </DocsPage>
  )
}
