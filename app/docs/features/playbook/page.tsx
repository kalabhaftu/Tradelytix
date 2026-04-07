export default function PlaybookDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Playbook & Trading Models</h1>
        <p className="text-lg text-muted-foreground">
          Define your trading strategies and track how each model performs over time.
        </p>
      </div>

      <h2>Overview</h2>
      <p>
        A Trading Model (or playbook entry) represents a specific setup or strategy you trade. 
        By tagging trades with their model, you can see which strategies are profitable and which need refinement.
      </p>

      <h2>Creating a Model</h2>
      <ol>
        <li>Go to <strong>Playbook</strong> from the sidebar</li>
        <li>Click <strong>New Model</strong></li>
        <li>Define: name, description, and rules/criteria</li>
        <li>Save — the model will now appear in trade tagging dropdowns</li>
      </ol>

      <h2>Tagging Trades</h2>
      <p>When reviewing your trades in the trade table or calendar, assign a trading model to each trade. This links the trade to your strategy for aggregated analysis.</p>

      <h2>Performance Tracking</h2>
      <p>The Playbook page shows per-model analytics:</p>
      <ul>
        <li>Win rate per model</li>
        <li>Average R-multiple</li>
        <li>Total P&L contribution</li>
        <li>Trade count and frequency</li>
        <li>Best/worst performing model comparison</li>
      </ul>
    </div>
  )
}
