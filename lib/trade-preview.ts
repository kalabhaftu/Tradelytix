export interface TradePreviewTransform {
  [key: string]: number
  zoom: number
  x: number
  y: number
}

export const DEFAULT_TRADE_PREVIEW_TRANSFORM: TradePreviewTransform = {
  zoom: 1,
  x: 0,
  y: 0,
}

export const MIN_TRADE_PREVIEW_ZOOM = 1
export const MAX_TRADE_PREVIEW_ZOOM = 3

export function clampTradePreviewZoom(zoom: number) {
  if (!Number.isFinite(zoom)) return DEFAULT_TRADE_PREVIEW_TRANSFORM.zoom
  return Math.min(MAX_TRADE_PREVIEW_ZOOM, Math.max(MIN_TRADE_PREVIEW_ZOOM, zoom))
}

export function getTradePreviewMaxOffset(zoom: number) {
  return Math.max(0, (clampTradePreviewZoom(zoom) - 1) * 50)
}

export function clampTradePreviewTransform(
  transform?: Partial<TradePreviewTransform> | null
): TradePreviewTransform {
  const zoom = clampTradePreviewZoom(transform?.zoom ?? DEFAULT_TRADE_PREVIEW_TRANSFORM.zoom)
  const maxOffset = getTradePreviewMaxOffset(zoom)
  const x = Number.isFinite(transform?.x) ? Number(transform?.x) : DEFAULT_TRADE_PREVIEW_TRANSFORM.x
  const y = Number.isFinite(transform?.y) ? Number(transform?.y) : DEFAULT_TRADE_PREVIEW_TRANSFORM.y

  return {
    zoom,
    x: Math.min(maxOffset, Math.max(-maxOffset, x)),
    y: Math.min(maxOffset, Math.max(-maxOffset, y)),
  }
}

export function normalizeTradePreviewTransform(value: unknown) {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_TRADE_PREVIEW_TRANSFORM }
  }

  const candidate = value as Partial<TradePreviewTransform>
  return clampTradePreviewTransform(candidate)
}

export function getTradePreviewTransformStyles(value: unknown) {
  const transform = normalizeTradePreviewTransform(value)

  return {
    transform,
    imageStyle: {
      transform: `translate3d(${transform.x}%, ${transform.y}%, 0) scale(${transform.zoom})`,
      transformOrigin: 'center center',
    },
  }
}
