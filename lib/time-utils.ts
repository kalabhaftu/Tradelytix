import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'America/New_York';

export type MarketSession = 'Asia' | 'London' | 'New York' | 'Outside Session';
export type KillzoneBadge = 'London Killzone' | 'NY Killzone' | 'Lunch Time' | 'NY PM Session';

// Sessions (for analysis) - Priority: NY > London > Asia
export const MARKET_SESSIONS = [
  { name: 'New York', start: 8, end: 17 },
  { name: 'London', start: 3, end: 12 },
  { name: 'Asia', start: 19, end: 4 }, // Crosses midnight
];

// Killzones (indicators only)
export const KILLZONE_BADGES = [
  { name: 'London Killzone', start: 2, end: 5 }, // (02:00 - 05:00)
  { name: 'NY Killzone', start: 7, end: 10 },    // Forex (07:00 - 10:00)
  { name: 'Lunch Time', start: 11.5, end: 13 },  // (11:30 - 13:00)
  { name: 'NY PM Session', start: 13, end: 16 }, // (13:00 - 16:00)
];

/**
 * Returns the analytical market session based on priority: NY > London > Asia.
 */
export function getTradingSession(date: Date | string | number): MarketSession {
  if (!date) return 'Outside Session';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Outside Session';

  const nyDate = toZonedTime(parsedDate, DEFAULT_TIMEZONE);
  const hour = nyDate.getHours();
  const minute = nyDate.getMinutes();
  const time = hour + minute / 60;

  // New York Priority (08:00 - 17:00)
  if (time >= 8 && time < 17) return 'New York';
  
  // London Priority (03:00 - 12:00)
  if (time >= 3 && time < 12) return 'London';
  
  // Asia Priority (19:00 - 04:00) - crosses midnight
  if (time >= 19 || time < 4) return 'Asia';

  return 'Outside Session';
}

export function getKillzoneBadge(date: Date | string | number, symbol?: string): KillzoneBadge | string | null {
  if (!date) return null;
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return null;

  const nyDate = toZonedTime(parsedDate, DEFAULT_TIMEZONE);
  const hour = nyDate.getHours();
  const minute = nyDate.getMinutes();
  const time = hour + minute / 60;

  // NY Killzone has special logic for Indices
  const isIndex = symbol && (
    symbol.includes('US30') || 
    symbol.includes('NAS100') || 
    symbol.includes('SPX500') || 
    symbol.includes('GER30') || 
    symbol.includes('DAX') ||
    ['NQ', 'ES', 'YM'].some(s => symbol.startsWith(s))
  );

  if (isIndex) {
    if (time >= 8.5 && time < 11) return 'NY Killzone';
  } else {
    // Forex NY AM
    if (time >= 7 && time < 10) return 'NY Killzone';
  }

  // Check other killzones
  for (const kz of KILLZONE_BADGES) {
    if (kz.name === 'NY Killzone') continue; // already handled
    
    if (time >= kz.start && time < kz.end) {
      return kz.name;
    }
  }

  return null;
}

/**
 * Helper to display time cleanly formatted according to user preferences.
 */
export function formatUserTime(date: Date | string | number, timezone: string = DEFAULT_TIMEZONE, use24HourFormat: boolean = true): string {
  if (!date) return 'N/A';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'N/A';

  const formatStr = use24HourFormat ? 'MMM d, yyyy HH:mm' : 'MMM d, yyyy h:mm a';
  return formatInTimeZone(parsedDate, timezone, formatStr);
}

/**
 * Helper to display time with a custom format string.
 */
export function formatTimeInZone(date: Date | string | number, formatStr: string, timezone: string = DEFAULT_TIMEZONE): string {
  if (!date) return 'N/A';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'N/A';
  return formatInTimeZone(parsedDate, timezone, formatStr);
}

/**
 * Calculate trade duration in seconds with timezone-safe parsing.
 * 
 * Handles common CSV timestamp formats:
 * - ISO 8601: "2024-01-15T09:30:00Z" or "2024-01-15T09:30:00-05:00"
 * - US format: "01/15/2024 09:30:00" (assumed broker timezone if no offset)
 * - Plain date: "2024-01-15" with separate time field
 * 
 * If timestamps lack timezone info, assumes they are in the broker's local timezone
 * (typically America/New_York for US brokers, or UTC for NinjaTrader exports).
 * 
 * @param entryDate - Trade entry timestamp
 * @param closeDate - Trade close timestamp
 * @param fallbackTimezone - Timezone to assume if timestamps lack timezone info (default: America/New_York)
 * @returns Duration in seconds, or 0 if calculation fails
 */
export function calculateTradeDuration(
  entryDate: Date | string | number | null | undefined,
  closeDate: Date | string | number | null | undefined,
  fallbackTimezone: string = DEFAULT_TIMEZONE
): number {
  if (!entryDate || !closeDate) return 0;

  try {
    // Parse dates, handling various formats
    const entry = normalizeToUTC(entryDate, fallbackTimezone);
    const close = normalizeToUTC(closeDate, fallbackTimezone);

    if (!entry || !close) return 0;
    
    const durationMs = close.getTime() - entry.getTime();
    
    // Sanity check: duration should be positive and reasonable (< 30 days)
    if (durationMs < 0 || durationMs > 30 * 24 * 60 * 60 * 1000) {
      return 0;
    }
    
    return Math.round(durationMs / 1000); // Convert to seconds
  } catch {
    return 0;
  }
}

/**
 * Normalize a date to UTC, handling timezone-naive strings.
 * 
 * @param date - Input date (various formats)
 * @param fallbackTimezone - Timezone to assume for naive timestamps
 * @returns Date object in UTC, or null if parsing fails
 */
function normalizeToUTC(
  date: Date | string | number,
  fallbackTimezone: string
): Date | null {
  if (!date) return null;
  
  // Already a Date object
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Number (timestamp)
  if (typeof date === 'number') {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // String - check if it has timezone info
  const dateStr = String(date).trim();
  
  // ISO 8601 with timezone (Z or +/-offset)
  if (/Z$|[+-]\d{2}:\d{2}$|[+-]\d{4}$/.test(dateStr)) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // ISO 8601 without timezone - assume fallback timezone
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
    // Convert to zoned time then to UTC
    try {
      const zonedDate = toZonedTime(new Date(dateStr + 'Z'), fallbackTimezone);
      const offset = getTimezoneOffset(fallbackTimezone, new Date(dateStr));
      const utcDate = new Date(zonedDate.getTime() - offset);
      return isNaN(utcDate.getTime()) ? new Date(dateStr) : utcDate;
    } catch {
      return new Date(dateStr);
    }
  }
  
  // Plain date format (various) - parse and assume fallback timezone
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Get timezone offset in milliseconds for a specific date.
 * This handles DST transitions correctly.
 */
function getTimezoneOffset(timezone: string, date: Date): number {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return tzDate.getTime() - utcDate.getTime();
  } catch {
    return 0;
  }
}
