import type { Metadata } from "next";
import { inter } from "@/lib/fonts";
import "./globals.css";
import { SafeToaster } from "@/components/safe-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Removed Vercel Analytics and Speed Insights to comply with essential-only cookie policy
import { AuthProvider } from "@/context/auth-provider";
import CookieNotice from "@/components/ui/cookie-notice";
import { ConsoleFilterWrapper } from "@/components/console-filter-wrapper";
import { ThemeProvider } from "@/context/theme-provider";
import { QueryProvider } from "@/lib/query/query-provider";
import { DeploymentMonitor } from "@/components/deployment-monitor";
import { ClientErrorReporter } from "@/components/error-reporter";
import { ErrorBoundaryWrapper } from "@/components/error-boundary";
import { SeasonalManager } from "@/app/dashboard/components/seasonal/seasonal-manager";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import Script from "next/script"

// Font configuration now imported from lib/fonts.ts

const DEFAULT_SITE_URL = 'https://www.deltalytix.eu.cc'
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL
const normalizedSiteUrl = rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`

// Simplified metadata for personal app (no SEO needed)
export const metadata: Metadata = {
  metadataBase: new URL(normalizedSiteUrl),
  title: "Deltalytix",
  description: "Personal trading analytics dashboard",
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
                root.classList.remove('accent-reports');
                if (accent === 'reports') {
                  root.classList.add('accent-reports');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
              }
            })();
          `}
        </Script>

        {/* DOM patches for third-party widget compatibility */}
        <Script id="dom-patches" strategy="beforeInteractive">
          {`
            (function() {
              if (typeof Node === 'function' && Node.prototype) {
                var originalRemoveChild = Node.prototype.removeChild;
                Node.prototype.removeChild = function(child) {
                  try {
                    if (child.parentNode !== this) {
                      return child;
                    }
                    return originalRemoveChild.call(this, child);
                  } catch (error) {
                    return child;
                  }
                };
              }
            })();
          `}
        </Script>

        {/* Prevent Google Translate DOM manipulation */}
        <Script id="prevent-google-translate" strategy="beforeInteractive">
          {`
            // Function to prevent Google Translate from modifying the DOM
            function preventGoogleTranslate() {
              // Prevent Google Translate from modifying the DOM
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  if (mutation.type === 'childList' && 
                      mutation.target.classList && 
                      mutation.target.classList.contains('goog-te-menu-frame')) {
                    // Prevent Google Translate from modifying our React components
                    const elements = document.querySelectorAll('[class*="goog-te-"]');
                    elements.forEach((el) => {
                      if (el.tagName === 'SPAN' && el.parentElement) {
                        // Preserve the original text content
                        const originalText = el.getAttribute('data-original-text') || el.textContent;
                        el.textContent = originalText;
                      }
                    });
                  }
                });
              });

              // Start observing the document with the configured parameters
              observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
              });

              // Prevent Google Translate from initializing
              if (window.google && window.google.translate) {
                window.google.translate.TranslateElement = function() {
                  return {
                    translate: function() {
                      return false;
                    }
                  };
                };
              }
            }

            // Run the prevention function
            preventGoogleTranslate();
          `}
        </Script>


        {/* Analytics removed to comply with essential-only cookie policy */}

        {/* Preload Satoshi font from Fontshare */}
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />

        {/* Performance: Preconnect to Supabase for faster API calls */}
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''}
          crossOrigin="anonymous"
        />

        {/* Performance: DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://api.fontshare.com" />
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
            /* Font fallback for when Fontshare CDN fails */
            @font-face {
              font-family: 'Satoshi Fallback';
              src: local('Satoshi'), local('-apple-system'), local('BlinkMacSystemFont'), local('Segoe UI'), local('Roboto');
              font-display: swap;
            }
            
            /* Ensure font variables are available */
            :root {
              --font-satoshi: 'Satoshi', 'Satoshi Fallback', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            /* Base layout */
            html {
              margin: 0;
              padding: 0;
              background-color: #020817 !important;
              color-scheme: dark;
              overflow-y: scroll !important;
              overflow-x: hidden !important;
              scrollbar-gutter: stable !important;
              -ms-overflow-style: scrollbar !important;
            }

            html.dark {
              background-color: #020817 !important;
              color-scheme: dark;
            }

            html.light {
              background-color: #ffffff !important;
              color-scheme: light;
            }

            body {
              min-height: 100vh !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: inherit !important;
              overflow-x: hidden !important;
            }

            /* Style the scrollbar */
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
        <ErrorBoundaryWrapper showDetails={process.env.NODE_ENV === 'development'}>
          <ThemeProvider>
            <QueryProvider>
              <ConsoleFilterWrapper>
                <AuthProvider>
                  <TooltipProvider>
                    <ServiceWorkerRegister />
                    <DeploymentMonitor />
                    <CookieNotice />
                    <SafeToaster />
                    <ClientErrorReporter />
                    <SeasonalManager />
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
