/**
 * Universal CSV Processor
 * 
 * A comprehensive CSV parser that auto-detects and processes trade data from any platform.
 * Supports: Tradezella, Tradovate, NinjaTrader, FTMO, Topstep, Exness, Match Trader, 
 * MetaTrader 4/5, cTrader, TradingView, Rithmic, Sierra Chart, Quantower, and more.
 */

import type { Trade } from '@prisma/client'
import { generateTradeHash } from '@/lib/utils'
import { calculateTradeDuration } from '@/lib/time-utils'

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessingResult {
  success: boolean
  trades: Partial<Trade>[]
  warnings: ProcessingWarning[]
  errors: ProcessingError[]
  detectedPlatform: string | null
  mappedFields: MappedFields
  missingRequiredFields: string[]
  stats: ProcessingStats
}

export interface ProcessingWarning {
  row: number
  field: string
  message: string
}

export interface ProcessingError {
  row: number
  message: string
  fatal: boolean
}

export interface ProcessingStats {
  totalRows: number
  processedRows: number
  skippedRows: number
  tradesWithStopLoss: number
  tradesWithTakeProfit: number
  tradesWithCommission: number
}

export interface MappedFields {
  instrument: string | null
  side: string | null
  quantity: string | null
  entryPrice: string | null
  closePrice: string | null
  entryDate: string | null
  closeDate: string | null
  pnl: string | null
  commission: string | null
  stopLoss: string | null
  takeProfit: string | null
  swap: string | null
  timeInPosition: string | null
  ticket: string | null
}

// ============================================================================
// FIELD MAPPINGS - Comprehensive header name variations
// ============================================================================

const FIELD_MAPPINGS: Record<keyof MappedFields, string[]> = {
  instrument: [
    // Common
    'symbol', 'instrument', 'ticker', 'asset', 'market', 'product', 'contract',
    // Platform-specific
    'contractname', 'contract_name', 'symbole', 'pair', 'currency_pair',
    // French
    'symbole', 'instrument', 'marché',
    // Variations
    'sym', 'instr', 'underlying', 'security', 'stock', 'future', 'forex'
  ],
  side: [
    // Common
    'side', 'type', 'direction', 'action', 'position', 'order_type', 'trade_type',
    // Platform-specific
    'market pos.', 'pos. marché.', 'buysell', 'buy_sell', 'long_short',
    // Variations
    'b/s', 'bs', 'l/s', 'ls', 'trade_side', 'position_type', 'order_side'
  ],
  quantity: [
    // Common
    'quantity', 'qty', 'size', 'volume', 'lots', 'contracts', 'shares', 'amount',
    // Platform-specific
    'qté', 'original_position_size', 'position_size', 'trade_size', 'lot_size',
    // Variations
    'units', 'no_of_lots', 'num_contracts', 'trade_qty', 'filled_qty'
  ],
  entryPrice: [
    // Common
    'entry_price', 'entryprice', 'open_price', 'openprice', 'opening_price', 'buy_price',
    // Platform-specific
    'prix d\'entrée', 'entry price', 'fill_price', 'avg_entry', 'average_entry',
    // Variations
    'open', 'bought_price', 'buyprice', 'in_price', 'start_price', 'prix'
  ],
  closePrice: [
    // Common
    'close_price', 'closeprice', 'exit_price', 'exitprice', 'closing_price', 'sell_price',
    // Platform-specific
    'prix de sortie', 'close price', 'exit price', 'avg_exit', 'average_exit',
    // Variations
    'close', 'sold_price', 'sellprice', 'out_price', 'end_price', 'prix'
  ],
  entryDate: [
    // Common
    'entry_date', 'entrydate', 'open_date', 'opendate', 'entry_time', 'entrytime',
    // Platform-specific  
    'opening_time_utc', 'open time', 'boughttimestamp', 'entered_at', 'enteredat',
    'heure d\'entrée', 'entry time', 'open_time', 'trade_open_time', 'ouvrir',
    // Variations
    'date_open', 'datetime_open', 'start_time', 'start_date', 'open_datetime'
  ],
  closeDate: [
    // Common
    'close_date', 'closedate', 'exit_date', 'exitdate', 'close_time', 'closetime',
    // Platform-specific
    'closing_time_utc', 'close time', 'soldtimestamp', 'exited_at', 'exitedat',
    'heure de sortie', 'exit time', 'close_time', 'trade_close_time', 'fermeture',
    // Variations
    'date_close', 'datetime_close', 'end_time', 'end_date', 'close_datetime'
  ],
  pnl: [
    // Common
    'pnl', 'profit', 'p&l', 'profit_loss', 'profitloss', 'net_pnl', 'gross_pnl',
    // Platform-specific
    'gross p&l', 'realized_pnl', 'realized_profit', 'net_profit', 'trade_result',
    // French
    'bénéfice', 'résultat',
    // Variations
    'gain', 'loss', 'return', 'pl', 'profit/loss', 'realized', 'net'
  ],
  commission: [
    // Common
    'commission', 'fee', 'fees', 'commissions', 'trading_fee', 'broker_fee',
    // Platform-specific
    'comm', 'order_fee', 'transaction_fee', 'brokerage',
    // Variations
    'cost', 'charges', 'expense', 'total_fee'
  ],
  stopLoss: [
    // Common
    'stop_loss', 'stoploss', 'sl', 'stop', 'stop_price', 'stopprice',
    // Platform-specific
    'stop loss', 's/l', 'stop-loss', 'protective_stop',
    // Variations
    'sl_price', 'slprice', 'stop_level', 'exit_stop'
  ],
  takeProfit: [
    // Common
    'take_profit', 'takeprofit', 'tp', 'target', 'profit_target', 'target_price',
    // Platform-specific
    'take profit', 't/p', 'take-profit', 'limit_price',
    // Variations
    'tp_price', 'tpprice', 'profit_level', 'exit_target'
  ],
  swap: [
    // Common
    'swap', 'overnight', 'rollover', 'financing', 'interest',
    // Platform-specific
    'swap_fee', 'overnight_fee', 'carry_cost',
    // Variations
    'funding', 'financing_cost'
  ],
  timeInPosition: [
    // Common
    'duration', 'time_in_position', 'timeinposition', 'hold_time', 'holding_time',
    // Platform-specific
    'durée du trade en secondes', 'trade_duration', 'position_duration',
    // Variations
    'time', 'elapsed', 'period', 'length'
  ],
  ticket: [
    // Common
    'ticket', 'id', 'trade_id', 'tradeid', 'order_id', 'orderid', 'position_id',
    // Platform-specific
    'deal_id', 'execution_id', 'reference', 'ref', 'buyfillid', 'sellfillid',
    'entry_name', 'exit_name', 'nom d\'entrée',
    // Variations
    'order_number', 'transaction_id', 'trade_number'
  ]
}

// ============================================================================
// SIDE VALUE MAPPINGS
// ============================================================================

const LONG_VALUES = ['buy', 'long', 'b', 'l', 'call', 'bullish', '1', 'acheter', 'achat']
const SHORT_VALUES = ['sell', 'short', 's', 'put', 'bearish', '-1', '0', 'vendre', 'vente']

// ============================================================================
// DATE FORMAT PATTERNS
// ============================================================================

const DATE_PATTERNS = [
  // ISO 8601
  { regex: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, format: 'ISO' },
  // US format with time: MM/DD/YYYY HH:MM:SS or MM/DD/YYYY HH:MM:SS AM/PM
  { regex: /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}(:\d{2})?(\s*(AM|PM))?$/i, format: 'US' },
  // EU format with time: DD/MM/YYYY HH:MM:SS
  { regex: /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}(:\d{2})?$/, format: 'EU' },
  // Date only: YYYY-MM-DD
  { regex: /^\d{4}-\d{2}-\d{2}$/, format: 'ISO_DATE' },
  // Date only: MM/DD/YYYY or DD/MM/YYYY
  { regex: /^\d{1,2}\/\d{1,2}\/\d{4}$/, format: 'SLASH_DATE' },
  // Unix timestamp
  { regex: /^\d{10,13}$/, format: 'UNIX' },
]

// ============================================================================
// SUPPORTED PLATFORMS (for auto-detection info)
// ============================================================================

export const SUPPORTED_PLATFORMS = [
  'Tradezella',
  'Tradovate', 
  'NinjaTrader',
  'FTMO',
  'Topstep',
  'Exness',
  'Match Trader',
  'MetaTrader 4/5',
  'cTrader',
  'TradingView',
  'Rithmic',
  'Sierra Chart',
  'Quantower',
  'TradeStation',
  'ThinkOrSwim',
  'Interactive Brokers',
  'Generic CSV'
] as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize a header string for matching
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[\u2019''′`]/g, "'") // Normalize quotes
    .replace(/[^a-z0-9']/g, '_')   // Replace special chars with underscore
    .replace(/_+/g, '_')           // Collapse multiple underscores
    .replace(/^_|_$/g, '')         // Trim underscores
}

/**
 * Find the best matching field for a header
 */
function findFieldMatch(header: string): keyof MappedFields | null {
  const normalizedHeader = normalizeHeader(header)
  
  for (const [field, patterns] of Object.entries(FIELD_MAPPINGS)) {
    for (const pattern of patterns) {
      const normalizedPattern = normalizeHeader(pattern)
      
      // Exact match
      if (normalizedHeader === normalizedPattern) {
        return field as keyof MappedFields
      }
      
      // Contains match (for compound headers)
      if (normalizedHeader.includes(normalizedPattern) || normalizedPattern.includes(normalizedHeader)) {
        return field as keyof MappedFields
      }
    }
  }
  
  return null
}

/**
 * Parse a date string into ISO format
 */
function parseDate(value: string, fallbackTimezone: string = 'America/New_York'): string | null {
  if (!value || value.trim() === '') return null
  
  const trimmed = value.trim()
  
  // Try ISO format first
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const date = new Date(trimmed)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  
  // Unix timestamp
  if (/^\d{10,13}$/.test(trimmed)) {
    const timestamp = parseInt(trimmed)
    const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp)
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  
  // US format: MM/DD/YYYY HH:MM:SS AM/PM or MM/DD/YYYY HH:MM:SS
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i)
  if (usMatch) {
    let [, month, day, year, hours, minutes, seconds, ampm] = usMatch
    let hour24 = parseInt(hours)
    
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12
      else if (ampm.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0
    }
    
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hour24,
      parseInt(minutes),
      parseInt(seconds || '0')
    )
    
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  
  // EU format: DD/MM/YYYY HH:MM:SS
  const euMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (euMatch) {
    const [, day, month, year, hours, minutes, seconds] = euMatch
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds || '0')
    )
    
    if (!isNaN(date.getTime())) {
      return date.toISOString()
    }
  }
  
  // Try native Date parsing as fallback
  const date = new Date(trimmed)
  if (!isNaN(date.getTime())) {
    return date.toISOString()
  }
  
  return null
}

/**
 * Parse a numeric value (handles currency symbols, parentheses for negatives, etc.)
 */
function parseNumeric(value: string): number | null {
  if (!value || value.trim() === '') return null
  
  let cleaned = value.trim()
  
  // Handle parentheses for negative: (123.45) -> -123.45
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1)
  }
  
  // Remove currency symbols and thousand separators
  cleaned = cleaned.replace(/[$€£¥₹,\s]/g, '')
  
  // Handle European decimal notation (comma as decimal)
  if (/^\-?\d+,\d+$/.test(cleaned)) {
    cleaned = cleaned.replace(',', '.')
  }
  
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/**
 * Parse time duration to seconds
 */
function parseDuration(value: string): number | null {
  if (!value || value.trim() === '') return null
  
  const trimmed = value.trim()
  
  // Already a number (seconds)
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Math.round(parseFloat(trimmed))
  }
  
  // Format: Xmin Ysec or Xm Ys
  const minSecMatch = trimmed.match(/(\d+)\s*(min|m)\s*(\d+)?\s*(sec|s)?/i)
  if (minSecMatch) {
    const minutes = parseInt(minSecMatch[1]) || 0
    const seconds = parseInt(minSecMatch[3]) || 0
    return minutes * 60 + seconds
  }
  
  // Format: HH:MM:SS or MM:SS
  const timeMatch = trimmed.match(/^(\d+):(\d{2})(?::(\d{2}))?$/)
  if (timeMatch) {
    if (timeMatch[3]) {
      // HH:MM:SS
      return parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3])
    } else {
      // MM:SS
      return parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2])
    }
  }
  
  return null
}

/**
 * Normalize side value to 'long' or 'short'
 */
function parseSide(value: string): 'long' | 'short' | null {
  if (!value || value.trim() === '') return null
  
  const normalized = value.toLowerCase().trim()
  
  if (LONG_VALUES.includes(normalized)) return 'long'
  if (SHORT_VALUES.includes(normalized)) return 'short'
  
  // Partial matches
  if (LONG_VALUES.some(v => normalized.includes(v))) return 'long'
  if (SHORT_VALUES.some(v => normalized.includes(v))) return 'short'
  
  return null
}

/**
 * Detect platform from headers
 */
function detectPlatform(headers: string[]): string | null {
  const normalizedHeaders = headers.map(h => normalizeHeader(h))
  const headerSet = new Set(normalizedHeaders)
  
  // Exness detection
  if (headerSet.has('opening_time_utc') && headerSet.has('closing_time_utc') && headerSet.has('lots')) {
    return 'Exness'
  }
  
  // Match Trader detection
  if (headerSet.has('open_time') && headerSet.has('close_time') && headerSet.has('reason')) {
    return 'Match Trader'
  }
  
  // Tradovate detection
  if (headerSet.has('boughttimestamp') && headerSet.has('soldtimestamp') && headerSet.has('buyfillid')) {
    return 'Tradovate'
  }
  
  // NinjaTrader detection (English or French)
  if ((headerSet.has('entry_time') && headerSet.has('exit_time') && headerSet.has('market_pos')) ||
      (headerSet.has('heure_d_entree') && headerSet.has('heure_de_sortie'))) {
    return 'NinjaTrader'
  }
  
  // Topstep detection
  if (headerSet.has('contractname') && headerSet.has('enteredat') && headerSet.has('exitedat')) {
    return 'Topstep'
  }
  
  // FTMO detection (position-based, check for specific column count)
  if (headers.length >= 14 && normalizedHeaders.includes('ticket') && normalizedHeaders.includes('ouvrir')) {
    return 'FTMO'
  }
  
  // Tradezella detection
  if (headerSet.has('account_name') && headerSet.has('open_date') && headerSet.has('gross_p_l')) {
    return 'Tradezella'
  }
  
  return 'Generic CSV'
}

// ============================================================================
// MAIN PROCESSOR
// ============================================================================

/**
 * Process CSV data into trades
 */
export function processUniversalCSV(
  headers: string[],
  data: string[][],
  options: {
    fallbackTimezone?: string
    skipEmptyRows?: boolean
    requirePnl?: boolean
  } = {}
): ProcessingResult {
  const {
    fallbackTimezone = 'America/New_York',
    skipEmptyRows = true,
    requirePnl = false
  } = options
  
  const result: ProcessingResult = {
    success: false,
    trades: [],
    warnings: [],
    errors: [],
    detectedPlatform: detectPlatform(headers),
    mappedFields: {
      instrument: null,
      side: null,
      quantity: null,
      entryPrice: null,
      closePrice: null,
      entryDate: null,
      closeDate: null,
      pnl: null,
      commission: null,
      stopLoss: null,
      takeProfit: null,
      swap: null,
      timeInPosition: null,
      ticket: null
    },
    missingRequiredFields: [],
    stats: {
      totalRows: data.length,
      processedRows: 0,
      skippedRows: 0,
      tradesWithStopLoss: 0,
      tradesWithTakeProfit: 0,
      tradesWithCommission: 0
    }
  }
  
  // Step 1: Map headers to fields
  const headerMapping: Record<number, keyof MappedFields> = {}
  
  headers.forEach((header, index) => {
    const field = findFieldMatch(header)
    if (field) {
      headerMapping[index] = field
      result.mappedFields[field] = header
    }
  })
  
  // Step 2: Check required fields
  const requiredFields: (keyof MappedFields)[] = ['instrument', 'entryDate']
  const optionalButImportant: (keyof MappedFields)[] = ['pnl', 'entryPrice', 'closePrice', 'side', 'quantity']
  
  for (const field of requiredFields) {
    if (!result.mappedFields[field]) {
      result.missingRequiredFields.push(field)
    }
  }
  
  // If P&L is required but missing, add to required fields
  if (requirePnl && !result.mappedFields.pnl) {
    result.missingRequiredFields.push('pnl')
  }
  
  // If critical fields are missing, return early with error
  if (result.missingRequiredFields.includes('instrument') || result.missingRequiredFields.includes('entryDate')) {
    result.errors.push({
      row: 0,
      message: `Missing required fields: ${result.missingRequiredFields.join(', ')}. Cannot process CSV.`,
      fatal: true
    })
    return result
  }
  
  // Step 3: Process each row
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex]
    
    // Skip empty rows
    if (skipEmptyRows && (!row || row.every(cell => !cell || cell.trim() === ''))) {
      result.stats.skippedRows++
      continue
    }
    
    // Skip summary/total rows (common in many platforms)
    const firstCell = row[0]?.toLowerCase() || ''
    if (firstCell.includes('total') || firstCell.includes('summary') || firstCell === '') {
      result.stats.skippedRows++
      continue
    }
    
    const trade: Partial<Trade> = {}
    let hasError = false
    
    // Extract values based on mapping
    for (const [indexStr, field] of Object.entries(headerMapping)) {
      const index = parseInt(indexStr)
      const cellValue = row[index]
      
      if (!cellValue || cellValue.trim() === '') continue
      
      switch (field) {
        case 'instrument':
          // Clean up instrument name (remove expiry dates, suffixes, etc.)
          let instrument = cellValue.trim()
          // Remove trailing digits that look like expiry (e.g., "MES 03-25" -> "MES")
          instrument = instrument.replace(/\s+\d{2}-\d{2}$/, '')
          // Remove trailing "m" suffix common in some platforms
          instrument = instrument.replace(/m$/, '')
          trade.instrument = instrument
          break
          
        case 'side':
          const side = parseSide(cellValue)
          if (side) trade.side = side
          break
          
        case 'quantity':
          const qty = parseNumeric(cellValue)
          if (qty !== null) trade.quantity = Math.abs(qty)
          break
          
        case 'entryPrice':
          const entryPrice = parseNumeric(cellValue)
          if (entryPrice !== null) trade.entryPrice = entryPrice.toString()
          break
          
        case 'closePrice':
          const closePrice = parseNumeric(cellValue)
          if (closePrice !== null) trade.closePrice = closePrice.toString()
          break
          
        case 'entryDate':
          const entryDate = parseDate(cellValue, fallbackTimezone)
          if (entryDate) trade.entryDate = entryDate
          break
          
        case 'closeDate':
          const closeDate = parseDate(cellValue, fallbackTimezone)
          if (closeDate) trade.closeDate = closeDate
          break
          
        case 'pnl':
          const pnl = parseNumeric(cellValue)
          if (pnl !== null) trade.pnl = pnl
          break
          
        case 'commission':
          const commission = parseNumeric(cellValue)
          if (commission !== null) {
            // Commission is stored as negative in the database
            trade.commission = commission > 0 ? -commission : commission
            result.stats.tradesWithCommission++
          }
          break
          
        case 'stopLoss':
          const sl = parseNumeric(cellValue)
          if (sl !== null && sl !== 0) {
            trade.stopLoss = sl.toString() as any // bypass strict typing if needed, but it should be string
            result.stats.tradesWithStopLoss++
          }
          break
          
        case 'takeProfit':
          const tp = parseNumeric(cellValue)
          if (tp !== null && tp !== 0) {
            trade.takeProfit = tp.toString() as any
            result.stats.tradesWithTakeProfit++
          }
          break
          
        case 'swap':
          const swap = parseNumeric(cellValue)
          if (swap !== null) {
            // Add swap to commission (overnight costs)
            trade.commission = (trade.commission || 0) + (swap < 0 ? swap : -swap)
          }
          break
          
        case 'timeInPosition':
          const duration = parseDuration(cellValue)
          if (duration !== null) trade.timeInPosition = duration
          break
          
        case 'ticket':
          trade.entryId = cellValue.trim()
          break
      }
    }
    
    // Validation
    if (!trade.instrument) {
      result.warnings.push({ row: rowIndex + 2, field: 'instrument', message: 'Missing instrument' })
      result.stats.skippedRows++
      continue
    }
    
    if (!trade.entryDate) {
      result.warnings.push({ row: rowIndex + 2, field: 'entryDate', message: 'Missing or invalid entry date' })
      result.stats.skippedRows++
      continue
    }
    
    // Calculate time in position if not provided
    if (!trade.timeInPosition && trade.entryDate && trade.closeDate) {
      trade.timeInPosition = calculateTradeDuration(trade.entryDate, trade.closeDate, fallbackTimezone)
    }
    
    // Default quantity to 1 if not provided
    if (!trade.quantity) {
      trade.quantity = 1
    }
    
    // Try to infer side from P&L and prices if not provided
    if (!trade.side && trade.entryPrice && trade.closePrice && trade.pnl !== undefined) {
      const entryNum = parseFloat(trade.entryPrice)
      const closeNum = parseFloat(trade.closePrice)
      if (trade.pnl > 0) {
        trade.side = closeNum > entryNum ? 'long' : 'short'
      } else if (trade.pnl < 0) {
        trade.side = closeNum < entryNum ? 'long' : 'short'
      }
    }
    
    // Generate unique ID
    trade.id = generateTradeHash(trade as Trade).toString()
    
    result.trades.push(trade)
    result.stats.processedRows++
  }
  
  result.success = result.trades.length > 0
  
  // Add warning if many trades lack important data
  if (result.stats.tradesWithStopLoss < result.trades.length * 0.5) {
    result.warnings.push({
      row: 0,
      field: 'stopLoss',
      message: `Only ${result.stats.tradesWithStopLoss} of ${result.trades.length} trades have stop loss data. R-Multiple calculations will be limited.`
    })
  }
  
  return result
}

/**
 * Validate if a CSV can be processed
 */
export function validateCSV(headers: string[]): { 
  valid: boolean
  mappedFields: MappedFields
  missingRequired: string[]
  suggestions: string[]
} {
  const mappedFields: MappedFields = {
    instrument: null,
    side: null,
    quantity: null,
    entryPrice: null,
    closePrice: null,
    entryDate: null,
    closeDate: null,
    pnl: null,
    commission: null,
    stopLoss: null,
    takeProfit: null,
    swap: null,
    timeInPosition: null,
    ticket: null
  }
  
  headers.forEach(header => {
    const field = findFieldMatch(header)
    if (field) {
      mappedFields[field] = header
    }
  })
  
  const missingRequired: string[] = []
  const suggestions: string[] = []
  
  if (!mappedFields.instrument) {
    missingRequired.push('instrument/symbol')
    suggestions.push('Add a column named "Symbol" or "Instrument" with the traded asset name')
  }
  
  if (!mappedFields.entryDate) {
    missingRequired.push('entry date/time')
    suggestions.push('Add a column with entry timestamp (e.g., "Entry Date", "Open Time")')
  }
  
  if (!mappedFields.pnl && !mappedFields.entryPrice) {
    suggestions.push('Consider adding P&L or entry/exit prices for better analysis')
  }
  
  return {
    valid: missingRequired.length === 0,
    mappedFields,
    missingRequired,
    suggestions
  }
}
