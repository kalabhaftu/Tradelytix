import Link from 'next/link'

export default function DonateGuideDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Support the Project</h1>
        <p className="text-lg text-muted-foreground">Help keep Deltalytix free for everyone.</p>
      </div>

      <h2>Why Donate?</h2>
      <p>Deltalytix is built and maintained by a solo developer, running entirely on free hosting services. Donations help cover:</p>
      <ul>
        <li>Domain and hosting costs</li>
        <li>Database and storage usage</li>
        <li>Development time for new features</li>
        <li>Keeping the platform ad-free</li>
      </ul>

      <h2>How to Donate</h2>
      <p>Visit the <Link href="/donate" className="text-primary hover:underline">donation page</Link> to see available crypto wallet addresses. Simply:</p>
      <ol>
        <li>Choose a token/network</li>
        <li>Copy the wallet address</li>
        <li>Send from your wallet</li>
      </ol>
      <p>We support Bitcoin, Ethereum, USDT (multiple networks), USDC, Solana, and BNB.</p>

      <h2>Other Ways to Help</h2>
      <ul>
        <li><strong>Star the repo</strong> on GitHub — visibility helps attract contributors</li>
        <li><strong>Share Deltalytix</strong> with other traders</li>
        <li><strong>Submit feedback</strong> — bug reports and feature requests are incredibly valuable</li>
        <li><strong>Contribute code</strong> — PRs are welcome!</li>
      </ul>
    </div>
  )
}
