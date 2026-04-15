import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

type OutdatedEntry = {
  current: string
  wanted: string
  latest: string
  dependent: string
  location: string
}

type DeltaType = 'none' | 'patch' | 'minor' | 'major' | 'unknown'

type DependencyDiagnostic = {
  package: string
  current: string
  wanted: string
  latest: string
  wantedDelta: DeltaType
  latestDelta: DeltaType
  withinRangeUpdateAvailable: boolean
  hasMajorUpgradeAhead: boolean
  latestOlderThanCurrent: boolean
}

function parseSemver(input: string): [number, number, number] | null {
  const match = input.match(/(\d+)\.(\d+)\.(\d+)/)
  if (!match) return null
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function getDelta(fromVersion: string, toVersion: string): DeltaType {
  if (fromVersion === toVersion) return 'none'
  const from = parseSemver(fromVersion)
  const to = parseSemver(toVersion)
  if (!from || !to) return 'unknown'

  if (to[0] !== from[0]) return 'major'
  if (to[1] !== from[1]) return 'minor'
  if (to[2] !== from[2]) return 'patch'
  return 'none'
}

function isOlderVersion(left: string, right: string): boolean {
  const l = parseSemver(left)
  const r = parseSemver(right)
  if (!l || !r) return false
  if (l[0] !== r[0]) return l[0] < r[0]
  if (l[1] !== r[1]) return l[1] < r[1]
  return l[2] < r[2]
}

function runOutdated(): Record<string, OutdatedEntry> {
  try {
    const stdout = execSync('npm outdated --json', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return stdout.trim().length > 0 ? JSON.parse(stdout) : {}
  } catch (error: any) {
    const stdout = error?.stdout?.toString?.() ?? ''
    if (!stdout || stdout.trim().length === 0) {
      throw error
    }
    return JSON.parse(stdout)
  }
}

function toMarkdown(params: {
  generatedAt: string
  diagnostics: DependencyDiagnostic[]
  patchOrMinorWithinRange: DependencyDiagnostic[]
  majorAhead: DependencyDiagnostic[]
  anomalies: DependencyDiagnostic[]
}): string {
  const {
    generatedAt,
    diagnostics,
    patchOrMinorWithinRange,
    majorAhead,
    anomalies,
  } = params

  const lines: string[] = []
  lines.push('# Dependency Diagnostic Report')
  lines.push('')
  lines.push(`Generated: ${generatedAt}`)
  lines.push(`Total outdated packages: ${diagnostics.length}`)
  lines.push(`Safe-now updates (within current range): ${patchOrMinorWithinRange.length}`)
  lines.push(`Major upgrades ahead: ${majorAhead.length}`)
  lines.push(`Anomalies (latest older than current): ${anomalies.length}`)
  lines.push('')

  lines.push('## Safe-Now (Wanted != Current)')
  lines.push('')
  if (patchOrMinorWithinRange.length === 0) {
    lines.push('No within-range updates available.')
  } else {
    lines.push('| Package | Current | Wanted | Delta |')
    lines.push('|---|---:|---:|---|')
    for (const item of patchOrMinorWithinRange) {
      lines.push(`| \`${item.package}\` | ${item.current} | ${item.wanted} | ${item.wantedDelta} |`)
    }
    lines.push('')
    lines.push('Suggested command (review first):')
    lines.push('```bash')
    lines.push(
      'npm install ' +
        patchOrMinorWithinRange.map((item) => `${item.package}@${item.wanted}`).join(' ')
    )
    lines.push('```')
  }
  lines.push('')

  lines.push('## Major-Upgrades-Ahead')
  lines.push('')
  if (majorAhead.length === 0) {
    lines.push('No major upgrades pending.')
  } else {
    lines.push('| Package | Current | Latest | Delta |')
    lines.push('|---|---:|---:|---|')
    for (const item of majorAhead) {
      lines.push(`| \`${item.package}\` | ${item.current} | ${item.latest} | ${item.latestDelta} |`)
    }
  }
  lines.push('')

  if (anomalies.length > 0) {
    lines.push('## Version Anomalies')
    lines.push('')
    lines.push('| Package | Current | Latest | Note |')
    lines.push('|---|---:|---:|---|')
    for (const item of anomalies) {
      lines.push(`| \`${item.package}\` | ${item.current} | ${item.latest} | latest appears older than current |`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

async function main() {
  const generatedAt = new Date().toISOString()
  const outdated = runOutdated()

  const diagnostics = Object.entries(outdated).map(([pkg, entry]): DependencyDiagnostic => {
    const wantedDelta = getDelta(entry.current, entry.wanted)
    const latestDelta = getDelta(entry.current, entry.latest)
    const withinRangeUpdateAvailable = entry.current !== entry.wanted
    const hasMajorUpgradeAhead = latestDelta === 'major'
    const latestOlderThanCurrent = isOlderVersion(entry.latest, entry.current)

    return {
      package: pkg,
      current: entry.current,
      wanted: entry.wanted,
      latest: entry.latest,
      wantedDelta,
      latestDelta,
      withinRangeUpdateAvailable,
      hasMajorUpgradeAhead,
      latestOlderThanCurrent,
    }
  })

  diagnostics.sort((a, b) => a.package.localeCompare(b.package))

  const patchOrMinorWithinRange = diagnostics.filter(
    (item) =>
      item.withinRangeUpdateAvailable &&
      (item.wantedDelta === 'patch' || item.wantedDelta === 'minor')
  )
  const majorAhead = diagnostics.filter((item) => item.hasMajorUpgradeAhead)
  const anomalies = diagnostics.filter((item) => item.latestOlderThanCurrent)

  const timestamp = generatedAt.replace(/[:.]/g, '-')
  const outDir = path.join(
    process.cwd(),
    'diagnostics',
    'dependencies',
    timestamp
  )
  await fs.mkdir(outDir, { recursive: true })

  const reportJsonPath = path.join(outDir, 'dependency-diagnostic.json')
  const reportMdPath = path.join(outDir, 'dependency-diagnostic.md')

  const reportPayload = {
    generatedAt,
    totals: {
      outdatedPackages: diagnostics.length,
      safeNowWithinRange: patchOrMinorWithinRange.length,
      majorAhead: majorAhead.length,
      anomalies: anomalies.length,
    },
    diagnostics,
  }

  await fs.writeFile(reportJsonPath, JSON.stringify(reportPayload, null, 2), 'utf-8')
  await fs.writeFile(
    reportMdPath,
    toMarkdown({
      generatedAt,
      diagnostics,
      patchOrMinorWithinRange,
      majorAhead,
      anomalies,
    }),
    'utf-8'
  )

  console.log('[diagnose:deps] complete')
  console.log(`[diagnose:deps] total outdated: ${diagnostics.length}`)
  console.log(`[diagnose:deps] safe-now within-range: ${patchOrMinorWithinRange.length}`)
  console.log(`[diagnose:deps] major-upgrades-ahead: ${majorAhead.length}`)
  console.log(`[diagnose:deps] anomalies: ${anomalies.length}`)
  console.log(`[diagnose:deps] report json: ${reportJsonPath}`)
  console.log(`[diagnose:deps] report md: ${reportMdPath}`)
}

main().catch((error) => {
  console.error('[diagnose:deps] failed', error)
  process.exit(1)
})

