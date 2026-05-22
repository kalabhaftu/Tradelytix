import PublicLayout from '@/components/layouts/public-layout'

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-2">Last updated: May 21, 2026</p>
        </div>

        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-xl font-semibold text-foreground">Use of Tradelytix</h2>
          <p>
            Tradelytix provides trading analytics, journaling, reporting, and account-management tools. It is not financial advice, investment advice, tax advice, or a brokerage service. You are responsible for your trading decisions and for verifying any imported or calculated data before relying on it.
          </p>
        </section>

        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-xl font-semibold text-foreground">Accounts and data</h2>
          <p>
            You are responsible for keeping your account secure and for the accuracy of the data you upload or enter. You may not use Tradelytix to upload unlawful content, attack the service, bypass security controls, or access another user’s data.
          </p>
        </section>

        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-xl font-semibold text-foreground">Subscriptions and payments</h2>
          <p>
            Paid features may be processed by third-party payment providers. Subscription access can be changed, suspended, or revoked for failed payments, fraud, abuse, or violation of these terms. Crypto payments may be final once processed by the payment provider or blockchain network.
          </p>
        </section>

        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-xl font-semibold text-foreground">Availability and liability</h2>
          <p>
            Tradelytix is provided as-is. We work to keep it reliable and secure, but we do not guarantee uninterrupted access, perfect accuracy, or suitability for any specific trading strategy. To the maximum extent allowed by law, Tradelytix is not liable for trading losses, lost profits, data-entry mistakes, import errors, or indirect damages.
          </p>
        </section>
      </div>
    </PublicLayout>
  )
}
