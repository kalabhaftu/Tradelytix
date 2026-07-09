"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export function TrackingScripts() {
  const [consent, setConsent] = useState<{ analytics: boolean; marketing: boolean }>({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const checkConsent = () => {
      try {
        const saved = localStorage.getItem("jji-cookie-consent");
        if (saved) {
          const parsed = JSON.parse(saved);
          setConsent({
            analytics: !!parsed.analytics,
            marketing: !!parsed.marketing,
          });
        }
      } catch (e) {
        console.error("Failed to parse cookie consent", e);
      }
    };

    // Initial check
    checkConsent();

    // Set up a custom event listener in case it's updated in the same window,
    // and storage event listener for cross-tab updates.
    window.addEventListener("storage", checkConsent);
    
    // We poll briefly in case the CookieConsent component just updated localStorage
    const interval = setInterval(checkConsent, 1000);

    return () => {
      window.removeEventListener("storage", checkConsent);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {consent.analytics && (
        <Script id="analytics-tracking" strategy="afterInteractive">
          {`
            console.log("Analytics tracking script activated.");
            // Add your Google Analytics or PostHog script here
            // window.dataLayer = window.dataLayer || [];
            // function gtag(){dataLayer.push(arguments);}
            // gtag('js', new Date());
            // gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      )}

      {consent.marketing && (
        <Script id="marketing-tracking" strategy="afterInteractive">
          {`
            console.log("Marketing tracking script activated.");
            // Add your Facebook Pixel or other marketing script here
          `}
        </Script>
      )}
    </>
  );
}
