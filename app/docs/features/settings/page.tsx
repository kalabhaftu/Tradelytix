export default function SettingsDocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1>Settings</h1>
        <p className="text-lg text-muted-foreground">Customize Deltalytix to fit your workflow.</p>
      </div>

      <h2>Available Settings</h2>

      <h3>General</h3>
      <ul>
        <li><strong>Timezone</strong> — Set your trading timezone for accurate date grouping</li>
        <li><strong>Time Format</strong> — Choose 12h or 24h display</li>
        <li><strong>Theme</strong> — System, Light, or Dark mode</li>
      </ul>

      <h3>Accent Packs</h3>
      <p>Customize the dashboard color scheme with pre-built accent packs. Options include Classic, Ocean, Sunset, Emerald, and more.</p>

      <h3>Calendar Display</h3>
      <ul>
        <li>Choose which stats appear on calendar day cells (P&L, trade count, R-multiple)</li>
        <li>Toggle the weekly summary row on/off</li>
      </ul>

      <h3>AI Settings</h3>
      <p>Configure AI-powered features like natural-language CSV parsing. Requires an API key for your chosen provider.</p>

      <h3>Account Linking</h3>
      <p>Link additional OAuth providers (Google, Discord) to your account for alternative login methods.</p>

      <h3>Auto-Adjust Account Date</h3>
      <p>When enabled, the dashboard date range automatically aligns with your selected account&apos;s active period.</p>
    </div>
  )
}
