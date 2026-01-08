import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

// Asia/Bangkok is UTC+7
export const TIMEZONE = 'Asia/Bangkok';

/**
 * Get current date in UTC+7 timezone as YYYY-MM-DD string
 */
export function getCurrentDateString(): string {
  const now = new TZDate(new Date(), TIMEZONE);
  return format(now, 'yyyy-MM-dd');
}

/**
 * Get date string from a Date object in UTC+7 timezone
 */
export function toDateString(date: Date): string {
  const tzDate = new TZDate(date, TIMEZONE);
  return format(tzDate, 'yyyy-MM-dd');
}

/**
 * Parse a date string (YYYY-MM-DD) to Date object at start of day in UTC+7
 */
export function fromDateString(dateString: string): Date {
  // Parse as UTC+7 midnight
  const [year, month, day] = dateString.split('-').map(Number);
  return new TZDate(year, month - 1, day, 0, 0, 0, 0, TIMEZONE);
}

/**
 * Check if a date string is before today (UTC+7)
 */
export function isBeforeToday(dateString: string): boolean {
  const today = getCurrentDateString();
  return dateString < today;
}

/**
 * Check if a date string is today (UTC+7)
 */
export function isToday(dateString: string): boolean {
  return dateString === getCurrentDateString();
}

/**
 * Check if a date string is after today (UTC+7)
 */
export function isAfterToday(dateString: string): boolean {
  const today = getCurrentDateString();
  return dateString > today;
}
