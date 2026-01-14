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
export class OpentalkEventScheduleService {
  private readonly logger = new Logger(OpentalkEventScheduleService.name);

  constructor(
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async handleEventUpdate(
    eventId: number,
    newDate: string,
  ): Promise<{ before: Cycle[]; after: Cycle[] }> {
    this.logger.log(
      `Handling manual event update: Event ${eventId} -> ${newDate}`,
    );

    const before = await this.getAllCyclesWithEvents();
    if (before.length === 0) return { before, after: [] };

    // Validate target event exists in loaded cycles
    const targetCycle = before.find((c) =>
      c.events.some((e) => e.id === eventId),
    );
    if (!targetCycle) {
      this.logger.warn(`Event ${eventId} not found in active/future cycles.`);
      return { before, after: [] };
    }

    this.logCyclesTable(
      `BEFORE - Update Event (${eventId} -> ${newDate})`,
      before,
    );

    const holidays = await this.getHolidays();
    const changes = this.calculateEventUpdateChanges(
      before,
      eventId,
      newDate,
      holidays,
    );

    const after = this.applyInMemoryChanges(before, changes);
    this.logCyclesTable(
      `AFTER - Update Event (${eventId} -> ${newDate})`,
      after,
    );

    if (changes.eventsToUpdate.length > 0) {
      await this.applyScheduleChanges(changes);
      this.logger.log(
        `Successfully rescheduled ${changes.eventsToUpdate.length} events due to manual update.`,
      );
    } else {
      this.logger.log(
        'No additional shifts needed (only target event updated).',
      );
      // Note: If only target event updated, we still need to persist it!
      // calculateEventUpdateChanges should include the target event update itself.
    }

    return { before, after };
  }

  private calculateEventUpdateChanges(
    cycles: Cycle[],
    targetEventId: number,
    newDate: string,
    holidays: Set<string>,
  ): ScheduleChanges {
    const changes: ScheduleChanges = {
      eventsToUpdate: [],
    };

    // 1. Update the target event in memory (conceptually) to sort and check collisions
    // We flatten all events to inspect collisions across cycle boundaries?
    // Or process per cycle?
    // If I move Event from C1 to C2 date range?
    // User said "In 1 Cycle Opentalk". I'll assume movement is within range or pushes boundaries appropriately.
    // Simplifying assumption: Cycles are just buckets. Flattening helps resolve global order.

    const allEvents = cycles.flatMap((c) =>
      c.events.map((e) => ({ ...e, cycleId: c.id })),
    );
    const targetEvent = allEvents.find((e) => e.id === targetEventId);

    if (!targetEvent) return changes; // Should be caught earlier

    // Add target update to changes immediately
    changes.eventsToUpdate.push({ eventId: targetEventId, newDate });
    targetEvent.date = newDate;

    // Re-sort events by date
    allEvents.sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;

      // Same date: Prioritize Target Event to 'win' the slot
      if (a.id === targetEventId) return -1;
      if (b.id === targetEventId) return 1;

      return a.id - b.id;
    });

    let prevDate: string | null = null;

    for (let i = 0; i < allEvents.length; i++) {
      const event = allEvents[i];

      // Skip comparing with self's initial state? (Already updated ref).

      if (prevDate) {
        // Collision Check: Strictly "same" date
        // (Or should we enforce sorting? We just sorted.)
        // If sorted, a.date >= b.date.
        // So if a.date == b.date, we have collision.

        if (event.date === prevDate) {
          // Collision!
          // Shift this event to next valid slot (Saturday)
          const nextSat = this.getNextSaturday(new Date(event.date), holidays);
          const nextSatStr = nextSat.toISOString().split('T')[0];

          // Queue update
          if (event.date !== nextSatStr) {
            changes.eventsToUpdate.push({
              eventId: event.id,
              newDate: nextSatStr,
            });
            event.date = nextSatStr; // Update in memory for next iteration ripple
          }
        } else {
          // No collision.
          // Do we check gap?
          // Example: C1 ends, C2 starts.
          // If we moved event into gap, that's fine.
          // If we created a collision, we resolved it.
          // What if shifting caused overlap with next event?
          // E.g. Jan 13 -> Jan 20.
          // Next event is Jan 20.
          // Next iteration: prevDate=Jan 20 from previous shift.
          // Current event=Jan 20.
          // Collision detected! Shift.
          // Logic holds.
        }
      }
      prevDate = event.date;
    }

    return changes;
  }

  private applyInMemoryChanges(
    cycles: Cycle[],
    changes: ScheduleChanges,
  ): Cycle[] {
    const newCycles = cycles.map((c) => ({
      ...c,
      events: c.events.map((e) => ({ ...e })),
    }));

    const updateMap = new Map(
      changes.eventsToUpdate.map((u) => [u.eventId, u.newDate]),
    );

    newCycles.forEach((c) => {
      let cycleChanged = false;
      c.events.forEach((e) => {
        if (updateMap.has(e.id)) {
          e.date = updateMap.get(e.id)!;
          cycleChanged = true;
        }
      });

      // If events moved, re-sort cycle events?
      if (cycleChanged) {
        c.events.sort((a, b) => a.date.localeCompare(b.date));
      }

      const lastEvent = c.events[c.events.length - 1];
      if (lastEvent) c.endDate = lastEvent.date;

      const firstEvent = c.events[0];
      if (firstEvent) c.startDate = firstEvent.date;
    });

    // Re-sort cycles?
    newCycles.sort((a, b) => a.startDate.localeCompare(b.startDate));

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

    const activeEvents = await this.eventRepository
      .createQueryBuilder('event')
      .select('DISTINCT event.cycleId', 'cycleId')
      .where('event.eventDate >= :today', { today })
      .andWhere('event.type = :type', { type: ScheduleType.OPENTALK })
      .getRawMany();

    if (activeEvents.length === 0) return [];

    const activeCycleIds = activeEvents.map((e) => e.cycleId);

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
    result.setDate(result.getDate() + 7);

    while (holidays.has(result.toISOString().split('T')[0])) {
      result.setDate(result.getDate() + 7);
    }

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
