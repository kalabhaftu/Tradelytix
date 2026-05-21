import PublicLayout from '@/components/layouts/public-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Heart, Github, Mail, Target, Shield, Zap } from 'lucide-react'
import { getSiteUiSettings } from '@/server/site-ui-settings'

export default async function AboutPage() {
  const siteUiSettings = await getSiteUiSettings()

  return (
    <PublicLayout>
      <div className="space-y-10">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">About Tradelytix</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg">
            A free, open-source trading analytics platform built for traders who want 
            professional-grade journaling without the premium price tag.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Target, title: 'Mission', desc: 'Make professional trade journaling accessible to every trader, regardless of their budget.' },
            { icon: Shield, title: 'Privacy First', desc: 'Your trading data stays yours. No selling data, no third-party analytics, no hidden tracking.' },
            { icon: Zap, title: 'Always Free', desc: 'Built and maintained solo with a commitment to keeping core features free forever.' },
          ].map((item, i) => (
            <Card key={i}>
              <CardContent className="pt-6 text-center">
                <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">The Story</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Tradelytix started as a personal trading workflow project and grew into a dedicated
                analytics platform shaped around real journaling, review, and performance-tracking needs.
                Over months of development, the product evolved from a simple tracker into a full trading
                dashboard with account management, reports, playbooks, reviews, and data controls.
              </p>
              <p>
                As a CFD trader myself, I know how hard it is to properly journal trades and visualize 
                performance, especially when you're just starting out and can't justify paying for 
                expensive tools. That's why I decided to open source it.
              </p>
              <p>
                Everything runs on free hosting services. It's not perfect, and there are limitations, 
                but I believe it can genuinely help people who want to improve their trading discipline 
                without breaking the bank.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-center gap-4">
          {siteUiSettings.showDonateButton && (
            <Button asChild size="lg">
              <Link href="/donate"><Heart className="h-4 w-4 mr-2" />Support the Project</Link>
            </Button>
          )}
          {siteUiSettings.showFeedbackButton && (
            <Button asChild variant="outline" size="lg">
              <Link href="/feedback"><Mail className="h-4 w-4 mr-2" />Send Feedback</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg">
            <Link href="/docs"><Zap className="h-4 w-4 mr-2" />Read the Docs</Link>
          </Button>
        </div>
      </div>
    </PublicLayout>
  )
}
