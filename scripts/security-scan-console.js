const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const SEARCH_DIRS = ['app', 'components', 'context', 'hooks', 'lib', 'server']
const ALLOWED_FILES = new Set([
  path.join('lib', 'console-filter.ts'),
  path.join('lib', 'console-interceptor.ts'),
  path.join('lib', 'logger.ts'),
  path.join('lib', 'error-logger.ts'),
])

const consolePattern = /\bconsole\.(log|debug|info)\s*\(/g
const failures = []

function isCommentOnly(line) {
  return line.trim().startsWith('//') || line.trim().startsWith('*')
}

function walk(dir) {
  if (!fs.existsSync(dir)) return

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }

    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue

    const rel = path.relative(ROOT, fullPath)
    if (ALLOWED_FILES.has(rel)) continue

    const text = fs.readFileSync(fullPath, 'utf8')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (!isCommentOnly(line) && consolePattern.test(line)) {
        failures.push(`${rel}:${index + 1}:${line.trim()}`)
      }
      consolePattern.lastIndex = 0
    })
  }
}

for (const dir of SEARCH_DIRS) {
  walk(path.join(ROOT, dir))
}

if (failures.length) {
  console.error('Runtime debug console statements found:')
  for (const failure of failures) {
    console.error(failure)
  }
  process.exit(1)
}

console.log('No runtime debug console statements found')
