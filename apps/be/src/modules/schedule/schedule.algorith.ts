import { ScheduleType } from '@qnoffice/shared';
import { fromDateString, toDateString } from '@src/common/utils/date.utils';
import { addDays, getDay, isWeekend } from 'date-fns';

// --- Interfaces ---

export interface Staff {
  id: number;
  username: string;
}

export interface ScheduleEvent {
  date: string; // Date string in YYYY-MM-DD format (UTC+7)
  staffIds: number[]; // Who is assigned
}

export interface CycleData {
  id: number;
  events: ScheduleEvent[];
}

export interface SchedulerConfig {
  type: ScheduleType;
  startDate: string; // Date string in YYYY-MM-DD format
  slotSize: number; // 2 for Cleaning, 1 for OpenTalk
  holidays: string[]; // Array of holiday date strings (YYYY-MM-DD)
}

// --- The Static Algorithm Class ---

export class SchedulingAlgorithm {
  /**
   * Generates a brand new cycle ensuring fairness and gap constraints.
   * Usage: Call this when a cycle ends and you need a fresh one.
   */
  static generateNewCycle(
    activeStaff: Staff[],
    previousCycle: CycleData | null,
    config: SchedulerConfig,
  ): ScheduleEvent[] {
    const { type, startDate, slotSize, holidays } = config;

    // 1. Prioritize Staff (Gap Constraint)
    // Goal: Users who did the task recently (end of prev cycle) should go to the back of the line.
    let sortedStaff = [...activeStaff];

    if (previousCycle && previousCycle.events.length > 0) {
      // Find the "danger zone" (e.g., last 30% of the previous cycle)
      const threshold = Math.floor(previousCycle.events.length * 0.7);
      const recentEvents = previousCycle.events.slice(threshold);

      const recentStaffIds = new Set(recentEvents.flatMap((e) => e.staffIds));

      // Split staff into "Safe" and "Recent" groups
      const safeGroup = sortedStaff.filter((s) => !recentStaffIds.has(s.id));
      const recentGroup = sortedStaff.filter((s) => recentStaffIds.has(s.id));

      // Shuffle both groups for randomness
      this.shuffleArray(safeGroup);
      this.shuffleArray(recentGroup);

      // Improved distribution: Mix recent staff throughout the second half rather than just at the end
      // Put safe group first, then distribute recent staff in the second portion
      const midPoint = Math.floor(safeGroup.length * 0.6);
      const earlyStaff = safeGroup.slice(0, midPoint);
      const laterStaff = safeGroup.slice(midPoint);

      // Interleave later safe staff with recent staff for better distribution
      const mixedLaterGroup: Staff[] = [];
      const maxLength = Math.max(laterStaff.length, recentGroup.length);

      for (let i = 0; i < maxLength; i++) {
        if (i < laterStaff.length) mixedLaterGroup.push(laterStaff[i]);
        if (i < recentGroup.length) mixedLaterGroup.push(recentGroup[i]);
      }

      // Final order: Early safe staff + mixed later staff and recent staff
      sortedStaff = [...earlyStaff, ...mixedLaterGroup];
    } else {
      // First run ever: just shuffle
      this.shuffleArray(sortedStaff);
    }

    // 2. Assign Slots
    const newSchedule: ScheduleEvent[] = [];
    let currentDate = fromDateString(startDate);
    let currentStaffIndex = 0;

    while (currentStaffIndex < sortedStaff.length) {
      // A. Find next valid date
      currentDate = this.getNextValidDate(currentDate, type, holidays);

      // B. Pick staff for this slot
      // Handle edge case: If remaining staff < slotSize (e.g., 1 person left for a 2-person job)
      // We still assign them. The cycle might end with a smaller group, or you can pull from next cycle (out of scope).
      const slotStaff = sortedStaff.slice(
        currentStaffIndex,
        currentStaffIndex + slotSize,
      );

      newSchedule.push({
        date: toDateString(currentDate),
        staffIds: slotStaff.map((s) => s.id),
      });

      // C. Advance
      currentStaffIndex += slotSize;
      currentDate = addDays(currentDate, 1); // Move pointer for next iteration
    }

    return newSchedule;
  }

  /**
   * Re-calculates (Shifts) an existing cycle due to mid-cycle changes.
   * Usage: Call this when a holiday is added or staff is offboarded/removed.
   * Logic: "Shift Up" - Keeps the order of remaining staff, just moves them to valid dates.
   */
  static shiftSchedule(
    currentEvents: ScheduleEvent[],
    removedStaffIds: number[], // IDs of staff who quit
    config: SchedulerConfig,
  ): ScheduleEvent[] {
    const { type, holidays } = config;

    // 1. Extract all remaining staff in their original order
    // We flatten the schedule to a list of staff, filtering out the removed ones.
    const remainingStaffIds: number[] = [];

    // We only care about future events or all events?
    // Usually we only shift "future" events relative to today, but for a pure function,
    // let's assume `currentEvents` passed in are the ones that need shifting (e.g., from tomorrow onwards).

    for (const event of currentEvents) {
      for (const staffId of event.staffIds) {
        if (!removedStaffIds.includes(staffId)) {
          remainingStaffIds.push(staffId);
        }
      }
    }

    // 2. Re-distribute staff into valid slots starting from the date of the first event
    if (currentEvents.length === 0) return [];

    const newSchedule: ScheduleEvent[] = [];
    let currentDate = fromDateString(currentEvents[0].date); // Start where we left off
    const { slotSize } = config;
    let currentStaffIndex = 0;

    while (currentStaffIndex < remainingStaffIds.length) {
      // A. Find next valid date
      currentDate = this.getNextValidDate(currentDate, type, holidays);

      // B. Fill slot
      const currentSlotIds = remainingStaffIds.slice(
        currentStaffIndex,
        currentStaffIndex + slotSize,
      );

      newSchedule.push({
        date: toDateString(currentDate),
        staffIds: currentSlotIds,
      });

      // C. Advance
      currentStaffIndex += slotSize;
      currentDate = addDays(currentDate, 1);
    }

    return newSchedule;
  }

  // --- Helper Methods ---

  /**
   * Finds the closest valid date starting from `fromDate`.
   * Skips weekends (for Cleaning), non-Saturdays (for OpenTalk), and Holidays.
   */
  private static getNextValidDate(
    fromDate: Date,
    type: ScheduleType,
    holidays: string[],
  ): Date {
    let checkDate = new Date(fromDate);

    while (true) {
      let isValid = true;

      // Rule 1: Holiday Check
      if (this.isHoliday(checkDate, holidays)) {
        isValid = false;
      }

      // Rule 2: Type Specific Check
      if (isValid) {
        if (type === ScheduleType.CLEANING) {
          // Mon-Fri only
          if (isWeekend(checkDate)) isValid = false;
        } else if (type === ScheduleType.OPENTALK) {
          // Saturday only (Day 6)
          if (getDay(checkDate) !== 6) isValid = false;
        }
      }

      if (isValid) {
        return checkDate;
      }

      checkDate = addDays(checkDate, 1);
    }
  }

  private static isHoliday(date: Date, holidays: string[]): boolean {
    const dateString = toDateString(date);
    return holidays.includes(dateString);
  }

  private static shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
