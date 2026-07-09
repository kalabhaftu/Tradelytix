import { Heart } from 'lucide-react'
import { DonateCardsClient } from './donate-cards-client'

export const metadata = {
  title: 'Support Tradelytix | Donate',
  description: 'Support the ongoing development of Tradelytix.'
}

export default function DonatePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      {/* Hero */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-2">
          <Heart className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Support Tradelytix</h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Tradelytix is a free trading journal and analytics platform. Donations help cover hosting,
          storage, and the ongoing work required to keep the product stable and improving.
        </p>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Choose a wallet below, copy the address, and send from your preferred network.
        </p>
      </div>

      {/* Donation Cards (Client) */}
      <DonateCardsClient />

      {/* Footer */}
      <div className="mt-12 border-t pt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Thank you for helping keep Tradelytix available to traders who need it.
        </p>
      </div>
    </div>
  )
}
