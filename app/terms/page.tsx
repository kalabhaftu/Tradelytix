import PublicLayout from '@/components/layouts/public-layout'

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-3 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">Last updated: July 2, 2026</p>
        </div>

        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Use of Tradelytix</h2>
          <p>
            Tradelytix provides trading analytics, journaling, reporting, and account-management tools. It is not financial advice, investment advice, tax advice, or a brokerage service. You are responsible for your trading decisions and for verifying any imported or calculated data before relying on it.
          </p>
        </section>

        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Accounts and data</h2>
          <p>
            You are responsible for keeping your account secure and for the accuracy of the data you upload or enter. You may not use Tradelytix to upload unlawful content, attack the service, bypass security controls, or access another user’s data.
          </p>
        </section>

        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Subscriptions and payments</h2>
          <p>
            Paid features may be processed by third-party payment providers. Subscription access can be changed, suspended, or revoked for failed payments, fraud, abuse, or violation of these terms. Crypto payments may be final once processed by the payment provider or blockchain network.
          </p>
        </section>

        <section className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Availability and liability</h2>
          <p>
            Tradelytix is provided as-is. We work to keep it reliable and secure, but we do not guarantee uninterrupted access, perfect accuracy, or suitability for any specific trading strategy. To the maximum extent allowed by law, Tradelytix is not liable for trading losses, lost profits, data-entry mistakes, import errors, or indirect damages.
          </p>
        </section>
      </div>
    </PublicLayout>
  )
}
