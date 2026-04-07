export default function WidgetsDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Widget Customization</h1>
        <p className="text-lg text-muted-foreground">
          Build your perfect dashboard by adding, removing, and arranging widgets.
        </p>
      </div>

      <h2>Overview</h2>
      <p>
        Deltalytix uses a fully customizable widget-based dashboard. You can choose which metrics, charts, and tools 
        appear on your screen and arrange them in any layout you prefer.
      </p>

      <h2>Available Widgets</h2>
      <ul>
        <li><strong>Equity Curve</strong> — Cumulative P&L over time</li>
        <li><strong>Calendar</strong> — Trading days with P&L heatmap</li>
        <li><strong>Drawdown Chart</strong> — Track max drawdown visually</li>
        <li><strong>Win Rate</strong> — Overall and per-direction win rate</li>
        <li><strong>R-Multiple Distribution</strong> — Histogram of trade quality</li>
        <li><strong>Trade Duration</strong> — Average hold time analysis</li>
        <li><strong>Session Analysis</strong> — Performance by trading session</li>
        <li><strong>Symbol Breakdown</strong> — P&L by instrument</li>
        <li><strong>Day of Week</strong> — Performance by weekday</li>
        <li>...and many more (20+ widgets available)</li>
      </ul>

      <h2>Managing Widgets</h2>
      <h3>Adding Widgets</h3>
      <p>Click the <strong>+</strong> button on your dashboard to open the widget picker. Select any widget to add it to your layout.</p>

      <h3>Rearranging</h3>
      <p>Drag and drop widgets to reorder them. Resize by dragging the edges of any widget.</p>

      <h3>Removing</h3>
      <p>Hover over a widget and click the <strong>×</strong> button to remove it.</p>

      <h2>Dashboard Templates</h2>
      <p>Save your widget layout as a template to quickly switch between different views (e.g., &quot;Daily Review&quot;, &quot;Weekly Analysis&quot;, &quot;Prop Firm Focus&quot;).</p>
      <ul>
        <li><strong>Create</strong> — Save current layout as a new template</li>
        <li><strong>Clone</strong> — Duplicate an existing template to customize</li>
        <li><strong>Apply</strong> — Switch to a saved template instantly</li>
      </ul>
    </div>
  )
}
