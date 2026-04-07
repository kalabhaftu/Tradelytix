export default function AccountsDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Accounts Management</h1>
        <p className="text-lg text-muted-foreground">
          Manage multiple trading accounts, master accounts, and prop firm evaluation phases.
        </p>
      </div>

      <h2>Account Types</h2>
      <h3>Master Accounts</h3>
      <p>A master account represents a relationship with a prop firm or broker. It contains one or more <strong>phase accounts</strong> that track your evaluation or live trading progress.</p>

      <h3>Phase Accounts</h3>
      <p>Each phase represents a stage in your prop firm journey (Phase 1, Phase 2, Live). Each phase has its own balance, rules, and risk limits configured.</p>

      <h2>Creating Accounts</h2>
      <ol>
        <li>Navigate to <strong>Prop Firm</strong> from the sidebar</li>
        <li>Click <strong>Add Account</strong></li>
        <li>Fill in: prop firm name, account number, starting balance, and risk rules</li>
        <li>Add phases as you progress through your evaluation</li>
      </ol>

      <h2>Account States</h2>
      <ul>
        <li><strong>Active</strong> — Currently trading on this account</li>
        <li><strong>Passed</strong> — Evaluation phase passed, awaiting next</li>
        <li><strong>Failed</strong> — Account breached risk rules</li>
        <li><strong>Archived</strong> — No longer in use, kept for records</li>
      </ul>

      <h2>Filtering by Account</h2>
      <p>The dashboard and reports can be filtered by account, letting you analyze performance per prop firm or evaluation phase independently.</p>
    </div>
  )
}
