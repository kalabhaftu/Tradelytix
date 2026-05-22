import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it } from 'vitest'
import { validateCronRequest } from '@/lib/cron-auth'

const OLD_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...OLD_ENV }
})

function request(headers?: HeadersInit) {
  return new NextRequest('https://www.tradelytix.eu.cc/api/cron/maintenance', { headers })
}

describe('cron auth', () => {
  it('accepts Vercel cron requests', () => {
    process.env.NODE_ENV = 'production'
    process.env.CRON_SECRET = 'x'.repeat(32)

    expect(validateCronRequest(request({ 'user-agent': 'vercel-cron/1.0' }))).toBeNull()
  })

  it('accepts valid bearer secret', () => {
    process.env.NODE_ENV = 'production'
    process.env.CRON_SECRET = 'x'.repeat(32)

    expect(validateCronRequest(request({ authorization: `Bearer ${'x'.repeat(32)}` }))).toBeNull()
  })

  it('rejects missing secret headers', () => {
    process.env.NODE_ENV = 'production'
    process.env.CRON_SECRET = 'x'.repeat(32)

    const response = validateCronRequest(request())

    expect(response?.status).toBe(401)
  })
})
