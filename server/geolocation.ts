import logger from '@/lib/logger';
import { db } from '@/lib/db/client'
import * as schema from '@/lib/db/schema'

interface GeoData {
  country?: string
  countryCode?: string
  city?: string
  region?: string
  lat?: number
  lon?: number
}

/**
 * Capture user geolocation from IP address.
 * Uses ip-api.com (free, no key needed for non-commercial).
 * Fire-and-forget — never blocks the auth flow.
 */
export async function captureUserGeo(userId: string, ipAddress: string): Promise<void> {
  try {
    if (!ipAddress || ipAddress === 'unknown' || isPrivateIP(ipAddress)) {
      return
    }

    const geo = await fetchGeoFromIP(ipAddress)
    if (!geo) return

    await db.insert(schema.UserGeoLog).values({
      userId,
      country: geo.country,
      countryCode: geo.countryCode,
      city: geo.city,
      region: geo.region,
      latitude: geo.lat,
      longitude: geo.lon,
      ipAddress,
    })
  } catch (err) {
    // Silent failure — geo tracking should never break the user flow
    logger.error({ event: 'system_error', error: err }, '[GeoCapture] Failed:')
  }
}

async function fetchGeoFromIP(ip: string): Promise<GeoData | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json()
    if (data.status !== 'success') return null

    return {
      country: data.country,
      countryCode: data.countryCode,
      city: data.city,
      region: data.regionName,
      lat: data.lat,
      lon: data.lon,
    }
  } catch {
    return null
  }
}

function isPrivateIP(ip: string): boolean {
  return (
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') ||
    ip.startsWith('192.168.') ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost'
  )
}

export function extractIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return headers.get('x-real-ip') || 'unknown'
}
