const { spawn } = require('child_process')
const path = require('path')

const isWindows = process.platform === 'win32'
const isWindowsSafeModeDisabled = process.env.NEXT_DISABLE_WINDOWS_WASM_FALLBACK === '1'

const nextArgs = process.argv.slice(2)
const requestedTurbo = nextArgs.includes('--turbo')
const useWindowsWasmFallback = isWindows && !isWindowsSafeModeDisabled

const filteredArgs = useWindowsWasmFallback
  ? nextArgs.filter((arg) => arg !== '--turbo')
  : nextArgs

const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || '1',
}

if (!env.NODE_OPTIONS) {
  env.NODE_OPTIONS = '--max-old-space-size=4096'
}

if (requestedTurbo && useWindowsWasmFallback) {
  console.warn(
    '[dev] Windows Application Control can block native Next SWC on this machine, so Turbopack is disabled for this local session. Next.js will use its built-in fallback path if the native compiler is unavailable.'
  )
}

if (useWindowsWasmFallback) {
  console.log(
    '[dev] Starting Next.js in Windows-safe local mode. This only affects local dev and does not change production builds.'
  )
}

const nextBin = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next')
const child = spawn(process.execPath, [nextBin, 'dev', ...filteredArgs], {
  stdio: 'inherit',
  env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

child.on('error', (error) => {
  console.error('[dev] Failed to start Next.js:', error)
  process.exit(1)
})
