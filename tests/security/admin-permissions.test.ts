import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const adminRoot = path.join(process.cwd(), 'app/api/v1/admin')

function routeFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return routeFiles(fullPath)
    return entry.name === 'route.ts' ? [fullPath] : []
  })
}

describe('admin API permissions', () => {
  it('guards every admin API route with requireAdmin', () => {
    const unguarded = routeFiles(adminRoot).filter((file) => !fs.readFileSync(file, 'utf8').includes('requireAdmin('))

    expect(unguarded).toEqual([])
  })
})
