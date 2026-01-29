import { TZDate } from '@date-fns/tz';
import { ScheduleType } from '@qnoffice/shared';
import { APP_TIMEZONE } from '@src/common/constants';
import { addDays, format, getDay, isWeekend, parse, isValid } from 'date-fns';

/**
 * Get current date in UTC+7 timezone as YYYY-MM-DD string
 */
export function getCurrentDateString(): string {
  const now = new TZDate(new Date(), APP_TIMEZONE);
  return format(now, 'yyyy-MM-dd');
}

/**
 * Get date string from a Date object in UTC+7 timezone
 */
export function toDateString(date: Date): string {
  const tzDate = new TZDate(date, APP_TIMEZONE);
  return format(tzDate, 'yyyy-MM-dd');
}

/**
 * Parse a date string (YYYY-MM-DD) to Date object at start of day in UTC+7
 */
export function fromDateString(dateString: string): Date {
  // Parse as UTC+7 midnight
  const [year, month, day] = dateString.split('-').map(Number);
  return new TZDate(year, month - 1, day, 0, 0, 0, 0, APP_TIMEZONE);
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
/**
 * Find the next valid date based on schedule type and holidays
 */
export function getNextValidDate(
  fromDate: Date,
  type: ScheduleType,
  holidays: string[],
): Date {
  let checkDate = addDays(fromDate, 1);
  while (true) {
    const dateStr = toDateString(checkDate);
    if (holidays.includes(dateStr)) {
      checkDate = addDays(checkDate, 1);
      continue;
    }

    if (type === ScheduleType.CLEANING) {
      if (isWeekend(checkDate)) {
        checkDate = addDays(checkDate, 1);
        continue;
      }
    } else if (type === ScheduleType.OPENTALK) {
      if (getDay(checkDate) !== 6) {
        // Saturday
        checkDate = addDays(checkDate, 1);
        continue;
      }
    }
    return checkDate;
  }
}

/**
 * Get the next working day (Monday-Friday) for cleaning, skipping holidays
 */
export function getNextCleaningDate(fromDate: Date, holidays: string[]): Date {
  return getNextValidDate(fromDate, ScheduleType.CLEANING, holidays);
}

/**
 * Get the next Saturday for Opentalk, skipping holidays
 */
export function getNextOpentalkDate(fromDate: Date, holidays: string[]): Date {
  return getNextValidDate(fromDate, ScheduleType.OPENTALK, holidays);
}


/**
 * Get Monday and Sunday on current week
 */

export function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); 

  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { monday, sunday };
}

/**
 * Parse Date from String to Date dd/MM/yyyy
 */
export function parseDate(input: string): Date | null {
  const date = parse(input, 'd/M/yyyy', new Date());
  return isValid(date) ? date : null;
}