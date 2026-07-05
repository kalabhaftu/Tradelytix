'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, Database, Globe, UserCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

const POLICY_DATE = 'July 2, 2026'

export default function PrivacyPage() {
  const router = useRouter()

  const sections = [
    {
      id: "introduction",
      icon: <Shield className="w-5 h-5 text-primary" />,
      title: "1. Introduction & Data Controller",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Welcome to Tradelytix. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our application, in compliance with the General Data Protection Regulation (GDPR) and other applicable data protection laws.
          </p>
          <p>
            For the purposes of the GDPR, Tradelytix acts as the Data Controller for the personal data we collect from you.
          </p>
        </div>
      )
    },
    {
      id: "data-collection",
      icon: <Database className="w-5 h-5 text-primary" />,
      title: "2. The Data We Collect",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>We may collect, use, store, and transfer different kinds of personal data about you, which we have grouped together as follows:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Identity Data:</strong> First name, last name, username, or similar identifiers.</li>
            <li><strong>Contact Data:</strong> Email address and billing address.</li>
            <li><strong>Financial Data:</strong> Payment details processed securely via our payment gateways (e.g., NOWPayments). We do not store raw credit card information.</li>
            <li><strong>Transaction Data:</strong> Details about payments to and from you, and other details of subscriptions you have purchased.</li>
            <li><strong>Technical Data:</strong> Internet protocol (IP) address, your login data, browser type and version, time zone setting and location, operating system, and platform.</li>
            <li><strong>Usage Data:</strong> Information about how you use our website, products, and services (including trading data, screenshots, notes, tags, and playbooks).</li>
          </ul>
        </div>
      )
    },
    {
      id: "legal-basis",
      icon: <Lock className="w-5 h-5 text-primary" />,
      title: "3. How We Use Your Data & Legal Basis",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>We will only use your personal data when the law allows us to. Under the GDPR, our legal bases for processing your data include:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Performance of a Contract:</strong> Where we need to perform the contract we are about to enter into or have entered into with you (e.g., providing the Tradelytix service).</li>
            <li><strong>Legitimate Interests:</strong> Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests (e.g., improving our platform, ensuring security).</li>
            <li><strong>Consent:</strong> Where you have provided explicit consent for specific processing (e.g., non-essential cookies or marketing emails).</li>
            <li><strong>Legal Obligation:</strong> Where we need to comply with a legal or regulatory obligation.</li>
          </ul>
        </div>
      )
    },
    {
      id: "third-parties",
      icon: <Globe className="w-5 h-5 text-primary" />,
      title: "4. Third-Party Sharing & International Transfers",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>We do not sell your personal data. We may share your data with trusted third-party service providers solely for the purpose of operating our service, including:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Cloud hosting and database providers (e.g., Vercel, Supabase).</li>
            <li>Payment processors (e.g., NOWPayments).</li>
            <li>Analytics and monitoring tools (e.g., Sentry) to detect and resolve platform errors.</li>
          </ul>
          <p>If we transfer your data outside the European Economic Area (EEA), we ensure a similar degree of protection is afforded to it by utilizing specific contracts approved by the European Commission.</p>
        </div>
      )
    },
    {
      id: "user-rights",
      icon: <UserCheck className="w-5 h-5 text-primary" />,
      title: "5. Your Legal Rights",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>Under the GDPR, you have the following rights regarding your personal data:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Right to Access:</strong> Request access to your personal data.</li>
            <li><strong>Right to Rectification:</strong> Request correction of the personal data that we hold about you.</li>
            <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> Request erasure of your personal data.</li>
            <li><strong>Right to Restriction:</strong> Request the restriction of processing of your personal data.</li>
            <li><strong>Right to Data Portability:</strong> Request the transfer of your personal data to you or a third party in a structured, machine-readable format.</li>
            <li><strong>Right to Object:</strong> Object to processing of your personal data where we are relying on a legitimate interest.</li>
          </ul>
          <p>To exercise any of these rights, please contact us or use the account management features within the application.</p>
        </div>
      )
    },
    {
      id: "cookies",
      icon: <Eye className="w-5 h-5 text-primary" />,
      title: "6. Cookies and Tracking Technologies",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            We use cookies and similar tracking technologies to track activity on our service and store certain information. You can configure your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. For more details, please see our <Link href="/cookies" className="text-primary hover:underline font-medium">Cookie Policy</Link>.
          </p>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 py-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight text-foreground">Tradelytix</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-muted-foreground hover:text-foreground transition-colors gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="space-y-12">
          <header className="space-y-4 pb-8 border-b border-border/40">
            <h1 className="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">Last updated: {POLICY_DATE}</p>
          </header>

          <div className="space-y-10">
            {sections.map((section, idx) => (
              <motion.section 
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {section.icon}
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
                </div>
                <div className="pl-12">
                  {section.content}
                </div>
              </motion.section>
            ))}
          </div>

          <footer className="pt-12 pb-8 border-t border-border/40 space-y-4 mt-16">
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground font-medium">
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold opacity-70">
              &copy; {new Date().getFullYear()} Tradelytix. All rights reserved.
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  )
}
