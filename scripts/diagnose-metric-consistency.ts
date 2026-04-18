import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

type MatchRecord = {
  file: string
  line: number
  snippet: string
}

type CheckResult = {
  key: string
  description: string
  pattern: string
  matches: MatchRecord[]
}

function runRipgrep(pattern: string): MatchRecord[] {
  try {
    const output = execSync(
      `rg --line-number --no-heading --color never --glob "!node_modules/**" --glob "!.next/**" --glob "!diagnostics/**" "${pattern}" app lib hooks server`,
      {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    )

    return parseRipgrepOutput(output)
  } catch (error: any) {
    const stdout = error?.stdout?.toString?.() ?? ''
    return parseRipgrepOutput(stdout)
  }
}

function parseRipgrepOutput(output: string): MatchRecord[] {
  if (!output || output.trim().length === 0) return []

  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const firstColon = line.indexOf(':')
      const secondColon = line.indexOf(':', firstColon + 1)
      if (firstColon === -1 || secondColon === -1) return null

      const file = line.slice(0, firstColon)
      const lineNumber = Number(line.slice(firstColon + 1, secondColon))
      const snippet = line.slice(secondColon + 1).trim()
      if (!file || !Number.isFinite(lineNumber)) return null

      return { file, line: lineNumber, snippet }
    })
    .filter((item): item is MatchRecord => item !== null)
}

function toMarkdown(generatedAt: string, checks: CheckResult[]): string {
  const lines: string[] = []
  lines.push('# Metric Consistency Audit')
  lines.push('')
  lines.push(`Generated: ${generatedAt}`)
  lines.push('')

  for (const check of checks) {
    lines.push(`## ${check.key}`)
    lines.push('')
    lines.push(`- Description: ${check.description}`)
    lines.push(`- Pattern: \`${check.pattern}\``)
    lines.push(`- Matches: ${check.matches.length}`)
    lines.push('')

    if (check.matches.length > 0) {
      lines.push('| File | Line | Snippet |')
      lines.push('|---|---:|---|')
      for (const match of check.matches) {
        const escapedSnippet = match.snippet.replace(/\|/g, '\\|')
        lines.push(`| \`${match.file}\` | ${match.line} | \`${escapedSnippet}\` |`)
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

async function main() {
  const generatedAt = new Date().toISOString()
  const timestamp = generatedAt.replace(/[:.]/g, '-')

  const checks: CheckResult[] = [
    {
      key: 'legacy_break_even_constant',
      description: 'Global BREAK_EVEN_THRESHOLD references outside the metric kernel',
      pattern: '\\bBREAK_EVEN_THRESHOLD\\b',
      matches: runRipgrep('\\bBREAK_EVEN_THRESHOLD\\b').filter(
        (match) =>
          match.file !== 'lib/utils.ts' &&
          match.file !== 'lib/metrics/outcome.ts'
      ),
    },
    {
      key: 'commission_reapplication',
      description: 'Potential double-count formulas that re-apply commission in metric layers',
      pattern: 'pnl\\s*[-+]\\s*\\(?\\s*.*commission|commission\\s*[-+]\\s*.*pnl',
      matches: runRipgrep('pnl\\s*[-+]\\s*\\(?\\s*.*commission|commission\\s*[-+]\\s*.*pnl'),
    },
    {
      key: 'manual_threshold_comparison',
      description: 'Direct threshold comparisons that should generally route through classifyOutcome',
      pattern: '>\\s*breakEvenThreshold|<\\s*-\\s*breakEvenThreshold|Math\\.abs\\([^)]*\\)\\s*<=\\s*breakEvenThreshold',
      matches: runRipgrep('>\\s*breakEvenThreshold|<\\s*-\\s*breakEvenThreshold|Math\\.abs\\([^)]*\\)\\s*<=\\s*breakEvenThreshold'),
    },
    {
      key: 'hardcoded_threshold_magic_numbers',
      description: 'Legacy magic thresholds for outcomes',
      pattern: '10\\.01|-10\\.01',
      matches: runRipgrep('10\\.01|-10\\.01'),
    },
  ]

  const outDir = path.join(
    process.cwd(),
    'diagnostics',
    'metrics-consistency',
    timestamp
  )
  await fs.mkdir(outDir, { recursive: true })

  const totalMatches = checks.reduce((sum, check) => sum + check.matches.length, 0)
  const summary = {
    generatedAt,
    totalChecks: checks.length,
    totalMatches,
    checks: checks.map((check) => ({
      key: check.key,
      description: check.description,
      pattern: check.pattern,
      matchCount: check.matches.length,
    })),
  }

  const jsonPath = path.join(outDir, 'metric-consistency-summary.json')
  const fullJsonPath = path.join(outDir, 'metric-consistency-full.json')
  const mdPath = path.join(outDir, 'metric-consistency-report.md')

  await fs.writeFile(jsonPath, JSON.stringify(summary, null, 2), 'utf-8')
  await fs.writeFile(fullJsonPath, JSON.stringify({ generatedAt, checks }, null, 2), 'utf-8')
  await fs.writeFile(mdPath, toMarkdown(generatedAt, checks), 'utf-8')

  console.log('[diagnose:metrics] complete')
  console.log(`[diagnose:metrics] total checks: ${checks.length}`)
  console.log(`[diagnose:metrics] total matches: ${totalMatches}`)
  for (const check of checks) {
    console.log(`[diagnose:metrics] ${check.key}: ${check.matches.length}`)
  }
  console.log(`[diagnose:metrics] summary json: ${jsonPath}`)
  console.log(`[diagnose:metrics] full json: ${fullJsonPath}`)
  console.log(`[diagnose:metrics] markdown report: ${mdPath}`)
}

main().catch((error) => {
  console.error('[diagnose:metrics] failed', error)
  process.exit(1)
})
