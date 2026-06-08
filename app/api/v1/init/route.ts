/**
 * Initial App Load API (v1)
 * 
 * GET /api/v1/init
 * 
 * Lightweight initial load endpoint replacing /api/bundled-data.
 * Returns only what's needed at app startup: user profile and accounts.
 * Trades are fetched separately via /api/v1/trades with proper filtering.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getInitBootstrapData } from '@/server/init-bootstrap'
import { applyRateLimit, apiLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
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
            }).catch((err: unknown) => logger.error('Geo logging failed', err, 'Init'))
          }
        }).catch((err: unknown) => logger.error('Geo logging failed on ip', err, 'Init'))
      }
    }

    const response = NextResponse.json(payload)
    
    // Access and payment state must reflect immediately after webhook-driven updates.
    response.headers.set('Cache-Control', 'private, no-store, no-cache, max-age=0, must-revalidate')
    return response
    
  } catch (error: any) {
    if (error.message?.includes('not authenticated') || error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    logger.error('/api/v1/init failed', error, 'Init API')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
