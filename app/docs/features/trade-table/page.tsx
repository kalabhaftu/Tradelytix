export default function TradeTableDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Trade Table</h1>
        <p className="text-lg text-muted-foreground">
          View, filter, sort, and edit all your trades in a powerful data table.
        </p>
      </div>

      <h2>Overview</h2>
      <p>
        The trade table gives you a spreadsheet-like view of every trade in your journal. 
        It supports inline editing, column customization, grouping, and advanced filtering — all without leaving the page.
      </p>

      <h2>Features</h2>
      <h3>Column Customization</h3>
      <p>Show or hide columns to focus on the metrics that matter to you. Available columns include: Symbol, Side, Entry/Exit Price, P&L, Duration, R-Multiple, Tags, Date, and more.</p>

      <h3>Inline Editing</h3>
      <p>Click on any editable cell to modify values directly. Changes are saved automatically. Editable fields include tags, notes, trading model, and trade outcome rating.</p>

      <h3>Filtering & Sorting</h3>
      <ul>
        <li><strong>Quick Filters</strong> — Filter by account, date range, side (long/short), or tag</li>
        <li><strong>Column Sorting</strong> — Click any column header to sort ascending or descending</li>
        <li><strong>Search</strong> — Find trades by symbol name</li>
      </ul>

      <h3>Grouping</h3>
      <p>Group trades by day, week, symbol, or account to see aggregated performance metrics at each level.</p>

      <h2>Tips</h2>
      <ul>
        <li>Use tags consistently to enable meaningful filtering later</li>
        <li>Rate every trade outcome (Good Win, Bad Win, Good Loss, Bad Loss) to track execution quality</li>
        <li>Export your filtered view for external analysis</li>
      </ul>
    </div>
  )
}
