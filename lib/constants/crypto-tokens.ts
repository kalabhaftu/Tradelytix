export interface TokenMeta {
  symbol: string
  name: string
  color: string
  logo: string
  aliases?: string[]
}

function normalizeTokenKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

export const TOKEN_META: Record<string, TokenMeta> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    color: '#F7931A',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/btc.svg',
    aliases: ['bitcoin'],
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    color: '#627EEA',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/eth.svg',
    aliases: ['ethereum'],
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether',
    color: '#26A17B',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdt.svg',
    aliases: ['tether', 'tetherusd'],
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    color: '#2775CA',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdc.svg',
    aliases: ['usdcoin', 'usdcoincircle'],
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    color: '#9945FF',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/sol.svg',
    aliases: ['solana'],
  },
  BNB: {
    symbol: 'BNB',
    name: 'BNB',
    color: '#F3BA2F',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/bnb.svg',
    aliases: ['binancecoin', 'binance'],
  },
}

const TOKEN_LOOKUP = new Map<string, string>()

for (const token of Object.values(TOKEN_META)) {
  TOKEN_LOOKUP.set(normalizeTokenKey(token.symbol), token.symbol)
  TOKEN_LOOKUP.set(normalizeTokenKey(token.name), token.symbol)
  for (const alias of token.aliases ?? []) {
    TOKEN_LOOKUP.set(normalizeTokenKey(alias), token.symbol)
  }
}

export const KNOWN_TOKEN_OPTIONS = Object.values(TOKEN_META)

export function resolveKnownTokenSymbol(input: string | null | undefined): string | null {
  if (!input) return null
  return TOKEN_LOOKUP.get(normalizeTokenKey(input)) ?? null
}

export function getTokenMeta(input: string): TokenMeta {
  const resolvedSymbol = resolveKnownTokenSymbol(input)

  if (resolvedSymbol) {
    return TOKEN_META[resolvedSymbol]
  }

  return {
    symbol: input.toUpperCase(),
    name: input,
    color: '#888888',
    logo: '',
  }
}
