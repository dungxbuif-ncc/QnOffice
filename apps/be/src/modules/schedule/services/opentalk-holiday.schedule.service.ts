import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ScheduleType } from '@qnoffice/shared';
import { getCurrentDateString } from '@src/common/utils/date.utils';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import { DataSource, Repository } from 'typeorm';
import ScheduleEventEntity from '../enties/schedule-event.entity';

export interface Event {
  id: number;
  date: string;
}

export interface Cycle {
  id: number;
  startDate: string;
  endDate: string;
  events: Event[];
}

interface EventUpdate {
  eventId: number;
  newDate: string;
}

interface ScheduleChanges {
  eventsToUpdate: EventUpdate[];
}

@Injectable()
export class OpentalkHolidayScheduleService {
  private readonly logger = new Logger(OpentalkHolidayScheduleService.name);

  constructor(
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async handleHolidayAdded(
    holidayDate: string,
  ): Promise<{ before: Cycle[]; after: Cycle[] }> {
    this.logger.log(`Handling holiday added: ${holidayDate}`);

    const before = await this.getAllCyclesWithEvents();
    if (before.length === 0) return { before, after: [] };

    this.logCyclesTable(`BEFORE - Holiday Add (${holidayDate})`, before);

    const holidays = await this.getHolidays();
    holidays.add(holidayDate);

    const changes = this.calculateHolidayChanges(before, holidays);

    const after = this.applyInMemoryChanges(before, changes);
    this.logCyclesTable(`AFTER - Holiday Add (${holidayDate})`, after);

    if (changes.eventsToUpdate.length > 0) {
      await this.applyScheduleChanges(changes);
      this.logger.log(
        `Successfully rescheduled ${changes.eventsToUpdate.length} events due to holiday.`,
      );
    } else {
      this.logger.log('No events affected by this holiday.');
    }

    return { before, after };
  }

  private calculateHolidayChanges(
    cycles: Cycle[],
    holidays: Set<string>,
  ): ScheduleChanges {
    const changes: ScheduleChanges = {
      eventsToUpdate: [],
    };

    // We process cycles sequentially.
    // If a cycle extends, we track its new end date to check overlap with next cycle.
    let prevCycleEndDate: string | null = null;

    // To handle cross-cycle awareness properly while iterating:
    // We treat the sequence as:
    // [Cycle 1 Events] ... gap ... [Cycle 2 Events]

    // We iterate cycles.
    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];

      const cycleUpdates = this.processCycleEvents(
        cycle,
        prevCycleEndDate,
        holidays,
      );

      if (cycleUpdates.length > 0) {
        changes.eventsToUpdate.push(...cycleUpdates);

        // Calculate new end date for this cycle
        // Calculate new end date for this cycle
        // If the last event was updated, use its new date.
        // If not, we still need the actual end date of the cycle (which might be the original last event).
        // But we need the *projected* end date considering updates.

        // Construct projected events for this cycle to determine true end date
        const lastEvent = cycle.events[cycle.events.length - 1];
        const updatedLastEvent = cycleUpdates.find(
          (u) => u.eventId === lastEvent.id,
        );
        prevCycleEndDate = updatedLastEvent
          ? updatedLastEvent.newDate
          : lastEvent.date;
      } else {
        // No changes in this cycle.
        prevCycleEndDate = cycle.events[cycle.events.length - 1].date;
      }
    }

    return changes;
  }

  private processCycleEvents(
    cycle: Cycle,
    prevCycleEndDate: string | null,
    holidays: Set<string>,
  ): EventUpdate[] {
    const updates: EventUpdate[] = [];
    let prevProyectedDate: Date | null = null;

    // Determine invalid date triggers.
    // 1. Event is on holiday.
    // 2. Event overlaps with previous cycle + 7 days (standard gap rule).

    // We iterate events in the cycle.
    for (let j = 0; j < cycle.events.length; j++) {
      const event = cycle.events[j];

      let projectedDate = new Date(event.date);
      let needsUpdate = false;

      // Case 1: First event of cycle
      if (j === 0) {
        // Check overlap with previous cycle if it shifted
        if (prevCycleEndDate) {
          const minStartDate = this.getNextSaturday(
            new Date(prevCycleEndDate),
            holidays,
          );
          // If current start < minStartDate, we must shift.
          // Note: minStartDate logic (next saturday) ensures 1-week gap and non-holiday.

          if (projectedDate.getTime() < minStartDate.getTime()) {
            projectedDate = minStartDate;
            needsUpdate = true;
          }
        }

        // Check if date is holiday (redundant if getNextSaturday handled it, but critical if no prev cycle)
        if (holidays.has(projectedDate.toISOString().split('T')[0])) {
          projectedDate = this.getNextSaturday(projectedDate, holidays);
          needsUpdate = true;
        }
      } else {
        // Subsequent events: Must follow prev event
        // Standard rule: Next saturday after prev event
        if (prevProyectedDate) {
          const expectedDate = this.getNextSaturday(
            prevProyectedDate,
            holidays,
          );
          if (projectedDate.getTime() !== expectedDate.getTime()) {
            projectedDate = expectedDate;
            needsUpdate = true;
          }
        }
      }

      // Also check specifically for the NEW holiday date if we haven't shifted yet?
      // If existing date == holidayDate, then holidays.has() above catches it.
      // So the logic holds.

      if (needsUpdate || updates.length > 0) {
        // Ripple effect: if any update occurred, verify subsequent
        // Actually the logic 'if projected != expected' covers ripple.
      }

      if (needsUpdate) {
        const newDateStr = projectedDate.toISOString().split('T')[0];
        // Only push if different from original (double check)
        if (newDateStr !== event.date) {
          updates.push({ eventId: event.id, newDate: newDateStr });
        }
      }

      prevProyectedDate = projectedDate;
    }

    return updates;
  }

  private applyInMemoryChanges(
    cycles: Cycle[],
    changes: ScheduleChanges,
  ): Cycle[] {
    // Deep copy cycles
    const newCycles = cycles.map((c) => ({
      ...c,
      events: c.events.map((e) => ({ ...e })),
    }));

    const updateMap = new Map(
      changes.eventsToUpdate.map((u) => [u.eventId, u.newDate]),
    );

    newCycles.forEach((c) => {
      c.events.forEach((e) => {
        if (updateMap.has(e.id)) {
          e.date = updateMap.get(e.id)!;
        }
      });
      // Update cycle end date
      const lastEvent = c.events[c.events.length - 1];
      if (lastEvent) c.endDate = lastEvent.date;
      // Update cycle start date
      const firstEvent = c.events[0];
      if (firstEvent) c.startDate = firstEvent.date;
    });

    return newCycles;
  }

  private async applyScheduleChanges(changes: ScheduleChanges): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const eventRepo = manager.getRepository(ScheduleEventEntity);

      for (const update of changes.eventsToUpdate) {
        await eventRepo.update(update.eventId, {
          eventDate: update.newDate,
        });
      }
    });
  }

  private async getAllCyclesWithEvents(): Promise<Cycle[]> {
    const today = getCurrentDateString();

    // 1. Find active/future cycle IDs
    const activeEvents = await this.eventRepository
      .createQueryBuilder('event')
      .select('DISTINCT event.cycleId', 'cycleId')
      .where('event.eventDate >= :today', { today })
      .andWhere('event.type = :type', { type: ScheduleType.OPENTALK })
      .getRawMany();

    if (activeEvents.length === 0) return [];

    const activeCycleIds = activeEvents.map((e) => e.cycleId);

    // 2. Fetch full details only for those relevant cycles
    const allEvents = await this.eventRepository
      .createQueryBuilder('event')
      .where('event.cycleId IN (:...ids)', { ids: activeCycleIds })
      .andWhere('event.type = :type', { type: ScheduleType.OPENTALK })
      .orderBy('event.eventDate', 'ASC')
      .getMany();

    if (allEvents.length === 0) return [];

    const cyclesMap = this.groupEventsByCycle(allEvents);
    return this.sortCyclesByStartDate(cyclesMap);
  }

  private groupEventsByCycle(
    events: ScheduleEventEntity[],
  ): Map<number, Cycle> {
    const cyclesMap = new Map<number, Cycle>();

    events.forEach((event) => {
      if (!cyclesMap.has(event.cycleId)) {
        cyclesMap.set(event.cycleId, {
          id: event.cycleId,
          startDate: event.eventDate,
          endDate: event.eventDate,
          events: [],
        });
      }

      const cycle = cyclesMap.get(event.cycleId)!;
      cycle.events.push({
        id: event.id,
        date: event.eventDate,
      });
      cycle.endDate = event.eventDate;
    });

    return cyclesMap;
  }

  private sortCyclesByStartDate(cyclesMap: Map<number, Cycle>): Cycle[] {
    return Array.from(cyclesMap.values()).sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );
  }

  private async getHolidays(): Promise<Set<string>> {
    const holidays = await this.holidayRepository.find();
    return new Set(
      holidays.map((h) => new Date(h.date).toISOString().split('T')[0]),
    );
  }

  private getNextSaturday(fromDate: Date, holidays: Set<string>): Date {
    const result = new Date(fromDate);
    result.setDate(result.getDate() + 7); // Default jump: 1 week

    // Correction: Logic in OpentalkStaffService was:
    // result.setDate(result.getDate() + 7);
    // while (holidays.has(result)) { +7 }
    // But this assumes fromDate + 7 is Saturday.
    // If fromDate was NOT Saturday (e.g. pushed from Sunday to Monday?), this keeps the day of week.
    // Opentalk events are Saturdays.
    // If we shift, we want the NEXT Saturday.
    // If calculateHolidayChanges logic ensures fromDate is Saturday, then fromDate+7 is Saturday.

    // BUT: getNextSaturday implies finding a valid Saturday date.
    // Ideally:
    // while (day != Saturday or isHoliday) { date++ }
    // But system design seems to enforce "Weekly on Saturday".
    // So "Next Slot" = +7 days.
    // If that Slot is Holiday -> +7 days again.

    while (holidays.has(result.toISOString().split('T')[0])) {
      result.setDate(result.getDate() + 7);
    }

    // Safety: ensure it is a Saturday?
    // Assuming data integrity assumes current events are Saturdays.
    return result;
  }

  private logCyclesTable(title: string, cycles: Cycle[]): void {
    this.logger.log(`\n--- ${title} ---`);
    if (cycles.length === 0) {
      this.logger.log('No cycles found.');
      return;
    }
    cycles.forEach((cycle) => {
      this.logger.log(
        `Cycle ${cycle.id} [${cycle.startDate} - ${cycle.endDate}]:`,
      );
      cycle.events.forEach((e) => {
        this.logger.log(`  - ${e.date}`);
      });
    });
  }
}
