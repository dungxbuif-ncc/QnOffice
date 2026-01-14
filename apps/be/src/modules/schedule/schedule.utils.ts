import { ScheduleType } from '@qnoffice/shared';
import { ONE_WEEK } from '@src/common/constants';
import { fromDateString } from '@src/common/utils/date.utils';
import { addDays, differenceInCalendarDays, startOfMonth } from 'date-fns';

/**
 * Check if the current date is exactly 7 days before the last event date
 */
export function isTriggerDay(lastEventDateStr: string, todayStr: string): boolean {
  const lastEventDate = fromDateString(lastEventDateStr);
  const today = fromDateString(todayStr);
  const daysUntilEnd = differenceInCalendarDays(lastEventDate, today);
  return daysUntilEnd === ONE_WEEK;
}

/**
 * Calculate the trigger status for automatic cycle creation
 */
export interface CycleTriggerStatus {
  shouldTrigger: boolean;
  daysUntilEnd: number;
}

export function getCycleTriggerStatus(lastEventDateStr: string, todayStr: string): CycleTriggerStatus {
  const lastEventDate = fromDateString(lastEventDateStr);
  const today = fromDateString(todayStr);
  const daysUntilEnd = differenceInCalendarDays(lastEventDate, today);
  
  return {
    shouldTrigger: daysUntilEnd === ONE_WEEK,
    daysUntilEnd,
  };
}

/**
 * Get next cycle info based on last event date
 */
export function getNextCycleInfo(lastEventDateStr: string, type: ScheduleType) {
  const lastEventDate = fromDateString(lastEventDateStr);
  const startDate = addDays(lastEventDate, 1);
  const startOfNextMonth = startOfMonth(startDate);
  
  const month = startOfNextMonth.getMonth() + 1;
  const year = startOfNextMonth.getFullYear();
  const nextMonthStr = `${month}/${year}`;
  
  const typeName = type === ScheduleType.CLEANING ? 'Cleaning' : 'OpenTalk';
  
  return {
    startDate,
    startOfNextMonth,
    nextMonthStr,
    cycleName: `${typeName} tháng ${nextMonthStr}`,
    description: `Auto-generated ${typeName.toLowerCase()} schedule for ${nextMonthStr}`,
  };
}

/**
 * Identify the active cycle from a list of cycles with their events
 */
export function findActiveCycle<T extends { events: { eventDate: string }[] }>(
  cycles: T[],
  todayStr: string,
): T | null {
  for (const cycle of cycles) {
    if (!cycle.events || cycle.events.length === 0) continue;

    const eventDates = cycle.events.map((e) => e.eventDate).sort();
    const startDate = eventDates[0];
    const endDate = eventDates[eventDates.length - 1];

    // Check if today falls exactly between the first and last event
    if (todayStr >= startDate && todayStr <= endDate) {
      return cycle;
    }
  }
  return null;
}
