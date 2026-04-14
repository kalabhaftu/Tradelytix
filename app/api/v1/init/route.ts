/**
 * Initial App Load API (v1)
 * 
 * GET /api/v1/init
 * 
 * Lightweight initial load endpoint replacing /api/bundled-data.
 * Returns only what's needed at app startup: user profile, accounts, calendar notes.
 * Trades are fetched separately via /api/v1/trades with proper filtering.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getInitBootstrapData } from '@/server/init-bootstrap'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { getCountryLabel, normalizeCityName, normalizeCountryCode } from '@/lib/geo'

export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, apiLimiter)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const payload = await getInitBootstrapData()
    
    // Background Geo Logging
    if (payload.isAuthenticated && payload.user?.id) {
      const headerList = await headers()
      const countryCode = normalizeCountryCode(headerList.get('x-vercel-ip-country'))
      const city = normalizeCityName(headerList.get('x-vercel-ip-city'))
      const country = countryCode ? getCountryLabel(undefined, countryCode) : null
      
      if (countryCode || city) {
        // Run completely asynchronously without blocking the payload delivery
        prisma.userGeoLog.findFirst({
          where: { userId: payload.user.id },
          orderBy: { createdAt: 'desc' }
        }).then(lastLog => {
          if (
            !lastLog ||
            normalizeCountryCode(lastLog.countryCode) !== countryCode ||
            normalizeCityName(lastLog.city) !== city
          ) {
            return prisma.userGeoLog.create({
              data: {
                userId: payload.user.id,
                countryCode: countryCode || null,
                country: country || null,
                city: city || null,
                ipAddress: headerList.get('x-forwarded-for') || 'hidden'
              }
            }).catch(console.error)
          }
        }).catch(console.error)
      }
    }

    const response = NextResponse.json(payload)
    
    // Cache: private (user-specific), revalidate every 60s
    response.headers.set('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=120')
    return response
    
  } catch (error: any) {
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[API] /api/v1/init error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
