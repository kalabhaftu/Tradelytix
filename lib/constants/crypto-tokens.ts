export interface TokenMeta {
  symbol: string
  name: string
  color: string
  logo: string
}

export const TOKEN_META: Record<string, TokenMeta> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    color: '#F7931A',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/btc.svg',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    color: '#627EEA',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/eth.svg',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether',
    color: '#26A17B',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdt.svg',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    color: '#2775CA',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdc.svg',
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    color: '#9945FF',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/sol.svg',
  },
  BNB: {
    symbol: 'BNB',
    name: 'BNB',
    color: '#F3BA2F',
    logo: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/bnb.svg',
  },
}

export function getTokenMeta(symbol: string): TokenMeta {
  return TOKEN_META[symbol.toUpperCase()] || {
    symbol: symbol.toUpperCase(),
    name: symbol,
    color: '#888888',
    logo: '',
  }
}
