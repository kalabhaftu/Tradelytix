import type { Metadata } from "next";
import { inter } from "@/lib/fonts";
import "./globals.css";
import { SafeToaster } from "@/components/safe-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Removed Vercel Analytics and Speed Insights to comply with essential-only cookie policy
import { AuthProvider } from "@/context/auth-provider";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { ConsoleFilterWrapper } from "@/components/console-filter-wrapper";
import { ThemeProvider } from "@/context/theme-provider";
import { QueryProvider } from "@/lib/query/query-provider";
import { DeploymentMonitor } from "@/components/deployment-monitor";
import { ClientErrorReporter } from "@/components/error-reporter";
import { ErrorBoundaryWrapper } from "@/components/error-boundary";
import { SeasonalManager } from "@/app/dashboard/components/seasonal/seasonal-manager";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { AppBanner } from "@/components/app-banner";
import Script from "next/script"

const DEFAULT_SITE_URL = 'https://www.tradelytix.eu.cc'
const SITE_NAME = 'Tradelytix'
const SITE_DESCRIPTION = 'Where traders find consistency through the charts'
const SOCIAL_PREVIEW_VERSION = 'tradelytix-20260522'
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL
const normalizedSiteUrl = rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`
const socialImage = `/opengraph-image.png?v=${SOCIAL_PREVIEW_VERSION}`
const twitterImage = `/twitter-image.png?v=${SOCIAL_PREVIEW_VERSION}`

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(normalizedSiteUrl),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: {
    title: SITE_NAME,
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: normalizedSiteUrl,
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: 'Tradelytix social preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [twitterImage],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`} translate="no" suppressHydrationWarning>
      <head>
        {/* Prevent Google Translate */}
        <meta name="google" content="notranslate" />
        <meta name="googlebot" content="notranslate" />
        <meta name="googlebot-news" content="notranslate" />

        {/* Analytics removed to comply with essential-only cookie policy */}

        {/* Performance: Preconnect to Supabase for faster API calls */}
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''}
          crossOrigin="anonymous"
        />

        {/* Performance: DNS prefetch for external resources */}
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="180x180"
          href="/apple-touch-icon-precomposed.png"
        />
        <style>
          {`
            :root {
              --font-system: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              --font-satoshi: var(--font-system);
            }

            html {
              margin: 0;
              padding: 0;
              background-color: hsl(var(--background)) !important;
              color-scheme: dark;
              overflow-y: scroll !important;
              overflow-x: hidden !important;
              scrollbar-gutter: stable !important;
              -ms-overflow-style: scrollbar !important;
            }

            html.dark {
              background-color: hsl(var(--background)) !important;
              color-scheme: dark;
            }

            html.light {
              background-color: hsl(var(--background)) !important;
              color-scheme: light;
            }

            body {
              min-height: 100vh !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: inherit !important;
              overflow-x: hidden !important;
            }

            ::-webkit-scrollbar {
              width: 14px !important;
              background-color: transparent !important;
            }

            ::-webkit-scrollbar-track {
              background: hsl(var(--background)) !important;
              border-left: 1px solid hsl(var(--border)) !important;
            }

            ::-webkit-scrollbar-thumb {
              background: hsl(var(--muted-foreground) / 0.3) !important;
              border-radius: 7px !important;
              border: 3px solid hsl(var(--background)) !important;
              min-height: 40px !important;
            }

            ::-webkit-scrollbar-thumb:hover {
              background: hsl(var(--muted-foreground) / 0.4) !important;
            }

            /* Firefox scrollbar styles */
            * {
              scrollbar-width: thin !important;
              scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent !important;
            }
          `}
        </style>

      </head>
      <body className={`${inter.variable} font-sans min-h-screen overflow-x-clip w-full`}>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var root = document.documentElement;
                // Dark-first prepaint to avoid white flash on hard refresh.
                root.style.colorScheme = 'dark';
                if (!root.classList.contains('dark')) {
                  root.classList.add('dark');
                }

                var saved = localStorage.getItem('theme') || 'dark';
                var effective = saved;
                if (saved === 'system') {
                  effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                if (effective !== 'light' && effective !== 'dark') effective = 'dark';
                if (effective === 'light') {
                  root.classList.remove('dark');
                  root.classList.add('light');
                  root.style.colorScheme = 'light';
                } else {
                  root.classList.remove('light');
                  root.classList.add('dark');
                  root.style.colorScheme = 'dark';
                }

                // Restore accent pack
                var accent = localStorage.getItem('accentPack') || 'classic';
                root.classList.remove('accent-reports', 'accent-violet', 'accent-slate');
                if (accent === 'reports') {
                  root.classList.add('accent-reports');
                } else if (accent === 'violet') {
                  root.classList.add('accent-violet');
                } else if (accent === 'slate') {
                  root.classList.add('accent-slate');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
              }
            })();
          `}
        </Script>

        <ErrorBoundaryWrapper showDetails={process.env.NODE_ENV === 'development'}>
          <ThemeProvider>
            <QueryProvider>
              <ConsoleFilterWrapper>
                <AuthProvider>
                  <TooltipProvider>
                    <ServiceWorkerRegister />
                    <DeploymentMonitor />
                    <CookieConsent />
                    <SafeToaster />
                    <ClientErrorReporter />
                    <SeasonalManager />
                    <AppBanner />
                    {children}
                  </TooltipProvider>
                </AuthProvider>
              </ConsoleFilterWrapper>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
