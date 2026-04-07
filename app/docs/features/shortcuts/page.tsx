export default function ShortcutsDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Keyboard Shortcuts</h1>
        <p className="text-lg text-muted-foreground">Navigate Deltalytix faster with keyboard shortcuts.</p>
      </div>

      <h2>Global Shortcuts</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Shortcut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>Ctrl/⌘ + K</code></td><td>Open quick search / command palette</td></tr>
            <tr><td><code>Ctrl/⌘ + /</code></td><td>Toggle sidebar</td></tr>
            <tr><td><code>Ctrl/⌘ + B</code></td><td>Toggle sidebar collapse</td></tr>
            <tr><td><code>Esc</code></td><td>Close dialogs and popups</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Dashboard Shortcuts</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Shortcut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>←</code> / <code>→</code></td><td>Navigate date range (previous/next period)</td></tr>
            <tr><td><code>T</code></td><td>Jump to today</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Journal Editor</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Shortcut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>Ctrl/⌘ + B</code></td><td>Bold</td></tr>
            <tr><td><code>Ctrl/⌘ + I</code></td><td>Italic</td></tr>
            <tr><td><code>Ctrl/⌘ + U</code></td><td>Underline</td></tr>
            <tr><td><code>Ctrl/⌘ + Shift + X</code></td><td>Strikethrough</td></tr>
            <tr><td><code>Ctrl/⌘ + V</code></td><td>Paste (supports images)</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
