const systemFontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

const systemFont = {
  variable: '--font-system',
  className: 'font-sans',
  style: {
    fontFamily: systemFontStack,
  },
}

const appFont = systemFont

// Backward-compatible aliases for existing layout imports.
export const satoshi = systemFont
export const inter = systemFont

const fontClassName = `${systemFont.variable} font-sans`
export const fontFamily = `var(--font-system), ${systemFontStack}`
