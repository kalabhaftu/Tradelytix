'use client'

import { useEffect } from 'react'
import * as mockData from '@/lib/demo/mock-data'

export function DemoNetworkInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch

    window.fetch = async function (input, init) {
      const urlString = typeof input === 'string' ? input : (input as Request).url || ''
      
      try {
        const parsedUrl = new URL(urlString, window.location.origin)
        const pathname = parsedUrl.pathname
        const method = init?.method || 'GET'

        if (pathname.startsWith('/api/v1/')) {
          // Simulated network lag
          await new Promise(resolve => setTimeout(resolve, 80))

          if (method !== 'GET') {
            return new Response(JSON.stringify({ success: true, message: 'Action simulated in Demo Mode' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/accounts$/)) {
            return new Response(JSON.stringify({ success: true, data: mockData.MOCK_ACCOUNTS }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }
          
          if (pathname.match(/^\/api\/v1\/accounts\/mock-acc-1$/)) {
            return new Response(JSON.stringify({ success: true, data: mockData.MOCK_LIVE_ACCOUNT_DETAILS }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/prop-firm\/accounts\/[^\/]+$/)) {
            return new Response(JSON.stringify({ success: true, data: mockData.MOCK_PROP_FIRM_DETAILS }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/prop-firm\/accounts\/[^\/]+\/payouts\/eligibility$/)) {
            return new Response(JSON.stringify({ success: true, data: mockData.MOCK_PAYOUT_ELIGIBILITY }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/settings\/webhook-token$/)) {
            return new Response(JSON.stringify({ success: true, data: mockData.MOCK_WEBHOOK_TOKEN }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/settings\/subscription$/)) {
            return new Response(JSON.stringify({ success: true, data: mockData.MOCK_SUBSCRIPTION }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/settings\/profile$/) || pathname.match(/^\/api\/v1\/profile$/)) {
            return new Response(JSON.stringify({ success: true, data: mockData.MOCK_USER_PROFILE }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/notifications$/)) {
            return new Response(JSON.stringify({ success: true, data: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }
        }
      } catch (e) {
        // Fallback to original fetch
      }

      return originalFetch.apply(this, [input, init])
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
export default DemoNetworkInterceptor
