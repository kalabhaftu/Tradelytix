type CanvasContext = CanvasRenderingContext2D

export type CalendarGradientPresetId =
  | 'midnight-prism'
  | 'aurora-glass'
  | 'ocean-glow'
  | 'sunset-bloom'

export interface CalendarGradientPreset {
  id: CalendarGradientPresetId
  label: string
  description: string
}

const PRESETS: CalendarGradientPreset[] = [
  {
    id: 'midnight-prism',
    label: 'Midnight Prism',
    description: 'Deep indigo base with violet and cobalt glow',
  },
  {
    id: 'aurora-glass',
    label: 'Aurora Glass',
    description: 'Emerald-to-cyan backdrop with glassy light',
  },
  {
    id: 'ocean-glow',
    label: 'Ocean Glow',
    description: 'Blue horizon with bright teal bloom',
  },
  {
    id: 'sunset-bloom',
    label: 'Sunset Bloom',
    description: 'Warm coral and plum with soft golden haze',
  },
]

export const CALENDAR_GRADIENT_PRESETS = PRESETS

export function resolveCalendarGradientPreset(variant: 'random' | CalendarGradientPresetId) {
  if (variant === 'random') {
    return PRESETS[Math.floor(Math.random() * PRESETS.length)]
  }

  return PRESETS.find((preset) => preset.id === variant) ?? PRESETS[0]
}

function fillRoundedRect(
  ctx: CanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function paintOrb(
  ctx: CanvasContext,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha = 1
) {
  const orb = ctx.createRadialGradient(x, y, 0, x, y, radius)
  orb.addColorStop(0, color)
  orb.addColorStop(0.45, color.replace(/[\d.]+\)$/u, `${alpha * 0.45})`))
  orb.addColorStop(1, color.replace(/[\d.]+\)$/u, '0)'))
  ctx.fillStyle = orb
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

export function drawCalendarGradientBackground(
  ctx: CanvasContext,
  presetId: CalendarGradientPresetId,
  width: number,
  height: number
) {
  const scale = Math.max(width, height) / 1000

  switch (presetId) {
    case 'aurora-glass': {
      const base = ctx.createLinearGradient(0, 0, width, height)
      base.addColorStop(0, '#081118')
      base.addColorStop(0.38, '#0f2d36')
      base.addColorStop(1, '#11336d')
      ctx.fillStyle = base
      ctx.fillRect(0, 0, width, height)

      paintOrb(ctx, width * 0.18, height * 0.12, 210 * scale, 'rgba(70, 255, 182, 0.9)')
      paintOrb(ctx, width * 0.78, height * 0.16, 260 * scale, 'rgba(68, 170, 255, 0.8)')
      paintOrb(ctx, width * 0.55, height * 0.85, 320 * scale, 'rgba(82, 109, 255, 0.55)')
      break
    }

    case 'ocean-glow': {
      const base = ctx.createLinearGradient(width * 0.1, 0, width * 0.9, height)
      base.addColorStop(0, '#050b1c')
      base.addColorStop(0.5, '#0a2559')
      base.addColorStop(1, '#0f6dd8')
      ctx.fillStyle = base
      ctx.fillRect(0, 0, width, height)

      paintOrb(ctx, width * 0.14, height * 0.18, 190 * scale, 'rgba(39, 225, 171, 0.75)')
      paintOrb(ctx, width * 0.85, height * 0.2, 240 * scale, 'rgba(56, 153, 255, 0.82)')
      paintOrb(ctx, width * 0.55, height * 0.94, 360 * scale, 'rgba(28, 108, 255, 0.65)')
      break
    }

    case 'sunset-bloom': {
      const base = ctx.createLinearGradient(0, 0, width, height)
      base.addColorStop(0, '#100a14')
      base.addColorStop(0.44, '#40204b')
      base.addColorStop(1, '#130d26')
      ctx.fillStyle = base
      ctx.fillRect(0, 0, width, height)

      paintOrb(ctx, width * 0.3, height * 0.14, 180 * scale, 'rgba(255, 123, 86, 0.78)')
      paintOrb(ctx, width * 0.64, height * 0.18, 170 * scale, 'rgba(255, 216, 116, 0.42)')
      paintOrb(ctx, width * 0.74, height * 0.8, 300 * scale, 'rgba(255, 76, 149, 0.42)')
      break
    }

    case 'midnight-prism':
    default: {
      const base = ctx.createLinearGradient(0, 0, width, height)
      base.addColorStop(0, '#0f0c29')
      base.addColorStop(0.5, '#302b63')
      base.addColorStop(1, '#24243e')
      ctx.fillStyle = base
      ctx.fillRect(0, 0, width, height)

      paintOrb(ctx, width * 0.3, height * 0.18, 170 * scale, 'rgba(255, 115, 64, 0.45)')
      paintOrb(ctx, width * 0.62, height * 0.16, 180 * scale, 'rgba(72, 155, 255, 0.42)')
      paintOrb(ctx, width * 0.5, height * 0.86, 310 * scale, 'rgba(124, 72, 255, 0.32)')
      break
    }
  }

  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.fillStyle = '#ffffff'
  for (let y = 0; y < height; y += 14 * scale) {
    ctx.fillRect(0, y, width, 1)
  }
  ctx.restore()
}

export function clipCalendarCardSurface(
  ctx: CanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: string
) {
  fillRoundedRect(ctx, x, y, width, height, radius)
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.clip()
}
