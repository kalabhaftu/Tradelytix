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

        if (pathname.startsWith('/api/v1/') || pathname.startsWith('/api/auth/')) {
          // Simulated network lag for realistic feel
          await new Promise(resolve => setTimeout(resolve, 80))

          // Specific POST/PATCH handlers must come before the generic non-GET blocker
          if (method === 'POST' && pathname.match(/^\/api\/v1\/reports\/stats$/)) {
            return new Response(JSON.stringify(mockData.getMockReportStats()), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/auth\/profile$/) || pathname.match(/^\/api\/v1\/profile$/)) {
            return new Response(JSON.stringify({ success: true, data: mockData.MOCK_USER_PROFILE }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/auth\/webhook-token$/) || pathname.match(/^\/api\/v1\/settings\/webhook-token$/)) {
            return new Response(JSON.stringify({ success: true, token: mockData.MOCK_WEBHOOK_TOKEN.token, data: mockData.MOCK_WEBHOOK_TOKEN }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          // Generic non-GET blocker (e.g. simulating actions like settings save)
          if (method !== 'GET') {
            return new Response(JSON.stringify({ success: true, message: 'Action simulated in Demo Mode' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          // GET handlers
          if (pathname.match(/^\/api\/v1\/init$/)) {
            return new Response(JSON.stringify({
              isAuthenticated: true,
              user: mockData.MOCK_USER_PROFILE,
              accounts: mockData.MOCK_ACCOUNTS,
              activeTemplateShell: {
                id: "demo-template-shell",
                userId: "demo-user",
                name: "Default Template",
                isDefault: true,
                isActive: true,
                layout: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            }), {
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

          if (pathname.match(/^\/api\/v1\/prop-firm\/accounts$/)) {
            return new Response(JSON.stringify({
              success: true,
              data: mockData.MOCK_ACCOUNTS.filter(a => a.accountType === 'prop-firm')
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/prop-firm\/accounts\/[^\/]+$/)) {
            const isFailedAcc = pathname.includes('mock-propfirm-failed');
            const data = mockData.getMockPropFirmDetails(isFailedAcc);
            return new Response(JSON.stringify({ success: true, data }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          if (pathname.match(/^\/api\/v1\/prop-firm\/accounts\/[^\/]+\/payouts\/eligibility$/)) {
            return new Response(JSON.stringify({ success: true, data: mockData.MOCK_PAYOUT_ELIGIBILITY }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          if (pathname.match(/^\/api\/v1\/prop-firm\/accounts\/[^\/]+\/trades$/)) {
            const isFailedAcc = pathname.includes('mock-propfirm-failed');
            const targetAccId = isFailedAcc ? 'mock-propfirm-failed' : 'mock-propfirm-1';
            const allTrades = mockData.getMockTradesList();
            const propFirmTrades = allTrades.filter(t => t.accountId === targetAccId);
            return new Response(JSON.stringify({ success: true, data: { trades: propFirmTrades } }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          if (pathname.match(/^\/api\/v1\/trades$/)) {
            return new Response(JSON.stringify(mockData.getMockDemoData()), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/goals$/)) {
            return new Response(JSON.stringify({ success: true, goals: mockData.MOCK_GOALS }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/notifications$/)) {
            return new Response(JSON.stringify({
              success: true,
              data: {
                notifications: mockData.MOCK_NOTIFICATIONS,
                unreadCount: 2
              }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }

          if (pathname.match(/^\/api\/v1\/subscription\/status$/) || pathname.match(/^\/api\/v1\/settings\/subscription$/)) {
            return new Response(JSON.stringify({ success: true, data: mockData.MOCK_SUBSCRIPTION }), {
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
