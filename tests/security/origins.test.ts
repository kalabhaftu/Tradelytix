import { afterEach, describe, expect, it, vi } from 'vitest'

const OLD_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...OLD_ENV }
  vi.resetModules()
})

describe('origin security helpers', () => {
  it('allows the production Tradelytix origin', async () => {
    process.env.NODE_ENV = 'production'
    const { isAllowedOrigin } = await import('@/lib/security/origins')

    expect(isAllowedOrigin('https://www.tradelytix.eu.cc')).toBe(true)
  })

  it('does not allow arbitrary production origins', async () => {
    process.env.NODE_ENV = 'production'
    const { getCorsHeaders, isAllowedOrigin } = await import('@/lib/security/origins')

    expect(isAllowedOrigin('https://evil.example')).toBe(false)
    expect(getCorsHeaders('https://evil.example')).toBeNull()
  })

  it('allows localhost only outside production', async () => {
    process.env.NODE_ENV = 'development'
    const { isAllowedOrigin } = await import('@/lib/security/origins')

    expect(isAllowedOrigin('http://localhost:3000')).toBe(true)
  })

  it('returns credentialed CORS headers only for allowlisted origins', async () => {
    process.env.NODE_ENV = 'production'
    const { getCorsHeaders } = await import('@/lib/security/origins')

    expect(getCorsHeaders('https://www.tradelytix.eu.cc')).toMatchObject({
      'Access-Control-Allow-Origin': 'https://www.tradelytix.eu.cc',
      'Access-Control-Allow-Credentials': 'true',
      Vary: 'Origin',
    })
  })
})
