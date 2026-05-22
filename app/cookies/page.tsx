import PublicLayout from '@/components/layouts/public-layout'

export default function CookiesPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cookie and Storage Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: May 21, 2026</p>
        </div>

        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-xl font-semibold text-foreground">Essential storage</h2>
          <p>
            Tradelytix uses essential cookies, local storage, and session storage to keep you signed in, secure your session, remember preferences such as theme and layout, support offline/PWA behavior, and make the application work correctly.
          </p>
        </section>

        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-xl font-semibold text-foreground">No advertising cookies</h2>
          <p>
            Tradelytix does not use advertising cookies. Production monitoring or error reporting may collect technical diagnostics when configured, but those tools are used to operate and secure the service rather than to sell ads.
          </p>
        </section>

        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-xl font-semibold text-foreground">Managing storage</h2>
          <p>
            You can clear cookies and local storage in your browser settings. Clearing essential storage may sign you out, reset preferences, or disable offline behavior until the app stores those values again.
          </p>
        </section>
      </div>
    </PublicLayout>
  )
}
