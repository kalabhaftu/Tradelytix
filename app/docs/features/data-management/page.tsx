export default function DataManagementDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Data Management</h1>
        <p className="text-lg text-muted-foreground">
          Backup, restore, export, and manage your trading data.
        </p>
      </div>

      <h2>Backup & Restore</h2>
      <p>Navigate to <strong>Data</strong> from the sidebar to access data management tools.</p>
      <ul>
        <li><strong>Export</strong> — Download your complete trade history as JSON or CSV for offline storage</li>
        <li><strong>Import</strong> — Restore from a previously exported backup file</li>
      </ul>

      <h2>Import Jobs</h2>
      <p>Large CSV imports are processed asynchronously to prevent timeouts. You&apos;ll see real-time progress and receive a notification when the import completes.</p>

      <h2>Data Privacy</h2>
      <ul>
        <li>Your data is stored in your Supabase account and never shared with third parties</li>
        <li>You can delete all your data at any time from Settings</li>
        <li>Exports give you a complete copy — you always own your data</li>
      </ul>

      <h2>Tips</h2>
      <ul>
        <li>Export a backup regularly, especially before major changes</li>
        <li>If an import fails, check that your CSV matches the expected format in the Import guide</li>
        <li>The import system supports: MetaTrader 4/5, cTrader, Rithmic, TradeZella, and generic CSV formats</li>
      </ul>
    </div>
  )
}
