import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ScheduleType } from '@qnoffice/shared';
import { getCurrentDateString } from '@src/common/utils/date.utils';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import { DataSource, Repository } from 'typeorm';
import ScheduleEventEntity from '../enties/schedule-event.entity';
import { SchedulerConfig, SchedulingAlgorithm } from '../schedule.algorith';

// Local Interfaces for DB mapping
interface Event {
  id: number;
  date: string;
  staffIds: number[];
}

interface Cycle {
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
export class CleaningScheduleService {
  private readonly logger = new Logger(CleaningScheduleService.name);

  constructor(
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async handleHolidayAdded(holidayDate: string): Promise<void> {
    this.logger.log(`Handling holiday added for Cleaning: ${holidayDate}`);

    const cycles = await this.getAllCyclesWithEvents();
    if (cycles.length === 0) return;

    const holidays = await this.getHolidays();
    // Ensure new holiday is included
    if (!holidays.includes(holidayDate)) {
      holidays.push(holidayDate);
    }

    const changes = this.calculateHolidayChanges(cycles, holidays);

    if (changes.eventsToUpdate.length > 0) {
      await this.applyScheduleChanges(changes);
      this.logger.log(
        `Successfully rescheduled ${changes.eventsToUpdate.length} Cleaning events due to holiday.`,
      );
    } else {
      this.logger.log('No Cleaning events affected by this holiday.');
    }
  }

  private calculateHolidayChanges(
    cycles: Cycle[],
    holidays: string[],
  ): ScheduleChanges {
    const changes: ScheduleChanges = {
      eventsToUpdate: [],
    };

    const config: SchedulerConfig = {
      type: ScheduleType.CLEANING,
      startDate: '', // Not used by shiftSchedule
      slotSize: 2,
      holidays: holidays,
    };

    for (const cycle of cycles) {
      // Convert to Algorithm Format
      const algoEvents = cycle.events.map((e) => ({
        date: e.date,
        staffIds: e.staffIds,
      }));

      // Run Algorithm
      const newSchedule = SchedulingAlgorithm.shiftSchedule(
        algoEvents,
        [],
        config,
      );

      // Map back changes
      // Assuming 1-to-1 mapping by index
      if (newSchedule.length !== cycle.events.length) {
        this.logger.error(
          `Algorithm returned ${newSchedule.length} events, expected ${cycle.events.length} for Cycle ${cycle.id}. skipping.`,
        );
        continue;
      }

      for (let i = 0; i < cycle.events.length; i++) {
        const oldEvent = cycle.events[i];
        const newEvent = newSchedule[i];

        if (oldEvent.date !== newEvent.date) {
          // Double check staff consistency?
          // shiftSchedule redistributes staff.
          // If the staff list is [A, B, C, D]
          // Events: [AB, CD]
          // shiftSchedule uses [A, B, C, D] and creates [AB, CD].
          // So staffIds should match exactly if no staff removed.
          const oldStaff = [...oldEvent.staffIds].sort().join(',');
          const newStaff = [...newEvent.staffIds].sort().join(',');

          if (oldStaff !== newStaff) {
            this.logger.warn(
              `Staff mismatch for event ${oldEvent.id} during shift. Old: ${oldStaff}, New: ${newStaff}. Ignoring update.`,
            );
            continue;
          }

          changes.eventsToUpdate.push({
            eventId: oldEvent.id,
            newDate: newEvent.date,
          });
        }
      }
    }

    return changes;
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
      .andWhere('event.type = :type', { type: ScheduleType.CLEANING })
      .getRawMany();

    if (activeEvents.length === 0) return [];

    const activeCycleIds = activeEvents.map((e) => e.cycleId);

    // 2. Fetch full details
    const allEvents = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.eventParticipants', 'participant')
      .where('event.cycleId IN (:...ids)', { ids: activeCycleIds })
      .andWhere('event.type = :type', { type: ScheduleType.CLEANING })
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
      // Map participants to IDs
      const staffIds = event.eventParticipants
        ? event.eventParticipants.map((p) => p.staffId)
        : [];

      cycle.events.push({
        id: event.id,
        date: event.eventDate,
        staffIds,
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

  private async getHolidays(): Promise<string[]> {
    const holidays = await this.holidayRepository.find();
    return holidays.map((h) => new Date(h.date).toISOString().split('T')[0]);
  }
}
