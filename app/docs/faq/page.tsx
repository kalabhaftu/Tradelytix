export default function FAQDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>FAQ & Troubleshooting</h1>
        <p className="text-lg text-muted-foreground">Common questions and solutions for Deltalytix.</p>
      </div>

      <h2>General</h2>
      <h3>Is Deltalytix free?</h3>
      <p>Yes. Deltalytix is 100% free and open source. All core features are available without any payment.</p>

      <h3>What brokers are supported?</h3>
      <p>Deltalytix supports CSV imports from MetaTrader 4, MetaTrader 5, cTrader, Rithmic, TradeZella exports, and a generic CSV format. AI-assisted parsing can handle many other formats too.</p>

      <h3>Where is my data stored?</h3>
      <p>Your data is stored securely in a Supabase (PostgreSQL) database. You own your data and can export it at any time.</p>

      <h2>Import Issues</h2>
      <h3>My CSV won&apos;t import</h3>
      <ul>
        <li>Make sure the file is a valid <code>.csv</code> file (not <code>.xlsx</code>)</li>
        <li>Check that the date format is consistent throughout the file</li>
        <li>Remove any summary rows at the bottom of your broker export</li>
        <li>If using a non-standard format, try the AI parser option</li>
      </ul>

      <h3>Import shows 0 trades</h3>
      <p>This usually means the parser couldn&apos;t match any columns. Verify your CSV has columns like: Symbol/Instrument, Open Time, Close Time, Profit, Volume/Lots.</p>

      <h3>Duplicate trades after re-import</h3>
      <p>The import system detects duplicates by matching open time + symbol + side. If duplicates still appear, delete the previous import batch from the Data page before re-importing.</p>

      <h2>Dashboard Issues</h2>
      <h3>Dashboard shows no data</h3>
      <ul>
        <li>Check the date range selector — it may be set to a period with no trades</li>
        <li>Verify the account filter — you may be viewing an empty account</li>
        <li>Clear the &quot;No Trades&quot; overlay by adjusting filters</li>
      </ul>

      <h3>Widgets not loading</h3>
      <p>Try refreshing the page. If the issue persists, clear your browser cache and cookies, then log in again.</p>

      <h2>Account & Login</h2>
      <h3>Can I use email/password login?</h3>
      <p>Currently, Deltalytix uses OAuth via Google and Discord. Email/password is not supported to reduce security overhead.</p>

      <h3>How do I delete my account?</h3>
      <p>Go to <strong>Settings</strong> and scroll to the danger zone. You can delete all your data. To fully delete your auth account, contact us via the feedback form.</p>
    </div>
  )
}
