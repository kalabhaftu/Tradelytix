export function parseTradePreviewImageValue(value?: string | null) {
  if (!value || typeof value !== "string") {
    return {
      src: null,
    }
  }

  return {
    src: value.split("#", 1)[0] || null,
  }
}

export function stripTradePreviewImageConfig(value?: string | null) {
  return parseTradePreviewImageValue(value).src
}
