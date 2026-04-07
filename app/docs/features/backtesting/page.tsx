export default function BacktestingDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Backtesting</h1>
        <p className="text-lg text-muted-foreground">
          Log and review backtested setups to validate your strategies before risking capital.
        </p>
      </div>

      <h2>Overview</h2>
      <p>
        The backtesting module lets you manually log trades you &quot;would have taken&quot; based on historical data. 
        This helps validate your models and build confidence before going live.
      </p>

      <h2>How to Use</h2>
      <ol>
        <li>Navigate to <strong>Backtesting</strong> from the sidebar</li>
        <li>Click <strong>New Backtest Trade</strong></li>
        <li>Fill in: symbol, direction, entry/exit, date, and screenshots</li>
        <li>Optionally assign a trading model</li>
        <li>Save for future review</li>
      </ol>

      <h2>Input Modes</h2>
      <ul>
        <li><strong>Manual</strong> — Enter all fields by hand (default)</li>
        <li><strong>Quick Entry</strong> — Streamlined form for rapid logging</li>
      </ul>

      <h2>Image Uploads</h2>
      <p>Attach chart screenshots to each backtest entry. This is invaluable for reviewing the visual pattern you identified and comparing it to live market behavior later.</p>

      <h2>Tips</h2>
      <ul>
        <li>Backtest at least 30 occurrences of a model before trading it live</li>
        <li>Always include a screenshot — your memory of the setup will fade</li>
        <li>Compare backtest results to live results in the Playbook to measure execution quality</li>
      </ul>
    </div>
  )
}
