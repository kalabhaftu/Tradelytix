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
    description: 'Deep purple-violet to midnight indigo with neon accents',
  },
  {
    id: 'aurora-glass',
    label: 'Aurora Glass',
    description: 'Rich forest green/emerald to dark teal and indigo',
  },
  {
    id: 'ocean-glow',
    label: 'Ocean Glow',
    description: 'Royal deep blue to sapphire with soft cyan highlight',
  },
  {
    id: 'sunset-bloom',
    label: 'Sunset Bloom',
    description: 'Warm plum to dark violet with golden haze',
  },
]

export const CALENDAR_GRADIENT_PRESETS = PRESETS

let randomizedPresetQueue: CalendarGradientPresetId[] = []

function shufflePresetIds() {
  const presetIds = PRESETS.map((preset) => preset.id)

  for (let i = presetIds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = presetIds[i]
    presetIds[i] = presetIds[j]
    presetIds[j] = current
  }

  return presetIds
}

export function getNextRandomCalendarGradientPreset() {
  if (randomizedPresetQueue.length === 0) {
    randomizedPresetQueue = shufflePresetIds()
  }

  const nextPresetId = randomizedPresetQueue.shift() ?? PRESETS[0].id
  return PRESETS.find((preset) => preset.id === nextPresetId) ?? PRESETS[0]
}

export function resolveCalendarGradientPreset(variant: 'random' | CalendarGradientPresetId) {
  if (variant === 'random') {
    return getNextRandomCalendarGradientPreset()
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
      base.addColorStop(0, '#020d08')
      base.addColorStop(0.45, '#041f17')
      base.addColorStop(1, '#020a1c')
      ctx.fillStyle = base
      ctx.fillRect(0, 0, width, height)

      paintOrb(ctx, width * 0.2, height * 0.2, 280 * scale, 'rgba(16, 185, 129, 0.75)')
      paintOrb(ctx, width * 0.8, height * 0.25, 300 * scale, 'rgba(20, 184, 166, 0.65)')
      paintOrb(ctx, width * 0.5, height * 0.85, 420 * scale, 'rgba(79, 70, 229, 0.5)')
      break
    }

    case 'ocean-glow': {
      const base = ctx.createLinearGradient(width * 0.1, 0, width * 0.9, height)
      base.addColorStop(0, '#02071a')
      base.addColorStop(0.5, '#07153b')
      base.addColorStop(1, '#010614')
      ctx.fillStyle = base
      ctx.fillRect(0, 0, width, height)

      paintOrb(ctx, width * 0.2, height * 0.25, 310 * scale, 'rgba(29, 78, 216, 0.8)')
      paintOrb(ctx, width * 0.75, height * 0.2, 290 * scale, 'rgba(37, 99, 235, 0.7)')
      paintOrb(ctx, width * 0.5, height * 0.85, 380 * scale, 'rgba(6, 182, 212, 0.55)')
      break
    }

    case 'sunset-bloom': {
      const base = ctx.createLinearGradient(0, 0, width, height)
      base.addColorStop(0, '#0d0514')
      base.addColorStop(0.45, '#240a2f')
      base.addColorStop(1, '#0b0410')
      ctx.fillStyle = base
      ctx.fillRect(0, 0, width, height)

      paintOrb(ctx, width * 0.25, height * 0.2, 300 * scale, 'rgba(124, 58, 237, 0.7)')
      paintOrb(ctx, width * 0.78, height * 0.22, 280 * scale, 'rgba(219, 39, 119, 0.6)')
      paintOrb(ctx, width * 0.5, height * 0.85, 410 * scale, 'rgba(245, 158, 11, 0.4)')
      break
    }

    case 'midnight-prism':
    default: {
      const base = ctx.createLinearGradient(0, 0, width, height)
      base.addColorStop(0, '#05020c')
      base.addColorStop(0.5, '#16082b')
      base.addColorStop(1, '#060210')
      ctx.fillStyle = base
      ctx.fillRect(0, 0, width, height)

      paintOrb(ctx, width * 0.3, height * 0.2, 280 * scale, 'rgba(139, 92, 246, 0.7)')
      paintOrb(ctx, width * 0.75, height * 0.3, 320 * scale, 'rgba(59, 130, 246, 0.6)')
      paintOrb(ctx, width * 0.5, height * 0.8, 400 * scale, 'rgba(236, 72, 153, 0.4)')
      break
    }
  }
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
