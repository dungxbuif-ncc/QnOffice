import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventStatus, ScheduleType } from '@qnoffice/shared';
import { getCurrentDateString } from '@src/common/utils/date.utils';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import { Repository } from 'typeorm';
import ScheduleEventParticipantEntity from '../enties/schedule-event-participant.entity';
import ScheduleEventEntity from '../enties/schedule-event.entity';

export interface Event {
  id: number;
  date: string;
  staffId: number;
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

interface EventCreation {
  cycleId: number;
  date: string;
  staffId: number;
}

interface ParticipantDeletion {
  eventId: number;
  staffId: number;
}

interface ScheduleChanges {
  eventsToCreate: EventCreation[];
  eventsToUpdate: EventUpdate[];
  participantsToDelete: ParticipantDeletion[];
}

@Injectable()
export class OpentalkStaffService {
  private readonly logger = new Logger(OpentalkStaffService.name);

  constructor(
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(ScheduleEventParticipantEntity)
    private readonly participantRepository: Repository<ScheduleEventParticipantEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepository: Repository<HolidayEntity>,
  ) {}

  static rescheduleNewStaffCycle(
    cycle: Cycle,
    staffId: number,
    holidays: Set<string>,
    startDateCycle?: string,
  ): Cycle {
    const lastEvent = cycle.events[cycle.events.length - 1];
    const newEventDate = OpentalkStaffService.getNextSaturday(
      new Date(lastEvent?.date || startDateCycle || cycle.startDate),
      holidays,
    );

    const newEvent: Event = {
      id: -1,
      date: newEventDate.toISOString().split('T')[0],
      staffId: staffId,
    };

    return {
      ...cycle,
      events: [...cycle.events, newEvent],
      endDate: newEvent.date,
    };
  }

  static rescheduleStaffLeaveCycle(
    cycle: Cycle,
    staffId: number,
    currentDate: string,
    holidays: Set<string>,
  ): Cycle {
    const staffEventIndex = cycle.events.findIndex(
      (e) => e.staffId === staffId && e.date >= currentDate,
    );

    if (staffEventIndex === -1) {
      return cycle;
    }

    const eventsAfter = cycle.events.slice(staffEventIndex + 1);
    const eventsBefore = cycle.events.slice(0, staffEventIndex);

    let prevDate =
      eventsBefore.length > 0
        ? new Date(eventsBefore[eventsBefore.length - 1].date)
        : new Date(cycle.startDate);

    const shiftedEvents = eventsAfter.map((event) => {
      const newDate = OpentalkStaffService.getNextSaturday(prevDate, holidays);
      prevDate = newDate;
      return {
        ...event,
        date: newDate.toISOString().split('T')[0],
      };
    });

    return {
      ...cycle,
      events: [...eventsBefore, ...shiftedEvents],
      endDate:
        shiftedEvents.length > 0
          ? shiftedEvents[shiftedEvents.length - 1].date
          : eventsBefore[eventsBefore.length - 1]?.date || cycle.endDate,
    };
  }

  static calculateNewStaffChanges(
    cycles: Cycle[],
    staffId: number,
    holidays: Set<string>,
  ): ScheduleChanges {
    const changes: ScheduleChanges = {
      eventsToCreate: [],
      eventsToUpdate: [],
      participantsToDelete: [],
    };

    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];
      const updatedCycle = OpentalkStaffService.rescheduleNewStaffCycle(
        cycle,
        staffId,
        holidays,
      );

      const newEvent = updatedCycle.events[updatedCycle.events.length - 1];
      if (newEvent.id === -1) {
        changes.eventsToCreate.push({
          cycleId: cycle.id,
          date: newEvent.date,
          staffId: staffId,
        });

        const nextCycle = cycles[i + 1];
        if (
          nextCycle &&
          OpentalkStaffService.shouldShiftCycle(
            newEvent.date,
            nextCycle.startDate,
          )
        ) {
          const nextCycleUpdates = OpentalkStaffService.shiftCycleEvents(
            nextCycle,
            newEvent.date,
            holidays,
          );
          changes.eventsToUpdate.push(...nextCycleUpdates);
        }
      }
    }

    return changes;
  }

  static calculateStaffLeaveChanges(
    cycles: Cycle[],
    staffId: number,
    currentDate: string,
    holidays: Set<string>,
  ): ScheduleChanges {
    const changes: ScheduleChanges = {
      eventsToCreate: [],
      eventsToUpdate: [],
      participantsToDelete: [],
    };

    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];
      const updatedCycle = OpentalkStaffService.rescheduleStaffLeaveCycle(
        cycle,
        staffId,
        currentDate,
        holidays,
      );

      const dateUpdates = OpentalkStaffService.getEventDateUpdates(
        cycle.events,
        updatedCycle.events,
      );
      changes.eventsToUpdate.push(...dateUpdates);

      const deletions = OpentalkStaffService.getParticipantDeletions(
        cycle.events,
        updatedCycle.events,
        staffId,
      );
      changes.participantsToDelete.push(...deletions);

      const nextCycle = cycles[i + 1];
      if (
        nextCycle &&
        OpentalkStaffService.shouldShiftCycle(
          updatedCycle.endDate,
          nextCycle.startDate,
        )
      ) {
        const nextCycleUpdates = OpentalkStaffService.shiftCycleEvents(
          nextCycle,
          updatedCycle.endDate,
          holidays,
        );
        changes.eventsToUpdate.push(...nextCycleUpdates);
      }
    }

    return changes;
  }

  static getEventDateUpdates(
    originalEvents: Event[],
    updatedEvents: Event[],
  ): EventUpdate[] {
    const updates: EventUpdate[] = [];

    for (const updatedEvent of updatedEvents) {
      const originalEvent = originalEvents.find(
        (e) => e.id === updatedEvent.id,
      );

      if (originalEvent && originalEvent.date !== updatedEvent.date) {
        updates.push({
          eventId: updatedEvent.id,
          newDate: updatedEvent.date,
        });
      }
    }

    return updates;
  }

  static getParticipantDeletions(
    originalEvents: Event[],
    updatedEvents: Event[],
    staffId: number,
  ): ParticipantDeletion[] {
    const originalEventIds = originalEvents.map((e) => e.id);
    const updatedEventIds = updatedEvents.map((e) => e.id);

    const removedEventIds = originalEventIds.filter(
      (id) => !updatedEventIds.includes(id),
    );

    return removedEventIds.map((eventId) => ({ eventId, staffId }));
  }

  static shiftCycleEvents(
    cycle: Cycle,
    newStartDate: string,
    holidays: Set<string>,
  ): EventUpdate[] {
    const updates: EventUpdate[] = [];
    let currentDate = new Date(newStartDate);

    for (const event of cycle.events) {
      currentDate = OpentalkStaffService.getNextSaturday(currentDate, holidays);
      const newDate = currentDate.toISOString().split('T')[0];

      if (event.date !== newDate) {
        updates.push({
          eventId: event.id,
          newDate: newDate,
        });
      }
    }

    return updates;
  }

  static shouldShiftCycle(
    currentEndDate: string,
    nextStartDate: string,
  ): boolean {
    return new Date(currentEndDate) >= new Date(nextStartDate);
  }

  static getNextSaturday(fromDate: Date, holidays: Set<string>): Date {
    const result = new Date(fromDate);
    result.setDate(result.getDate() + 7);

    while (holidays.has(result.toISOString().split('T')[0])) {
      result.setDate(result.getDate() + 7);
    }

    return result;
  }

  static applyChangesToCycles(
    cycles: Cycle[],
    changes: ScheduleChanges,
  ): Cycle[] {
    const cyclesMap = new Map(
      cycles.map((c) => [
        c.id,
        {
          ...c,
          events: c.events.map((e) => ({ ...e })),
        },
      ]),
    );

    for (const creation of changes.eventsToCreate) {
      const cycle = cyclesMap.get(creation.cycleId);
      if (cycle) {
        cycle.events.push({
          id: -1,
          date: creation.date,
          staffId: creation.staffId,
        });
        if (creation.date > cycle.endDate) {
          cycle.endDate = creation.date;
        }
      }
    }

    for (const update of changes.eventsToUpdate) {
      for (const cycle of cyclesMap.values()) {
        const event = cycle.events.find((e) => e.id === update.eventId);
        if (event) {
          event.date = update.newDate;
          const maxDate = Math.max(
            ...cycle.events.map((e) => new Date(e.date).getTime()),
          );
          cycle.endDate = new Date(maxDate).toISOString().split('T')[0];
          break;
        }
      }
    }

    for (const deletion of changes.participantsToDelete) {
      for (const cycle of cyclesMap.values()) {
        const eventIndex = cycle.events.findIndex(
          (e) => e.id === deletion.eventId && e.staffId === deletion.staffId,
        );
        if (eventIndex !== -1) {
          cycle.events.splice(eventIndex, 1);
          if (cycle.events.length > 0) {
            const maxDate = Math.max(
              ...cycle.events.map((e) => new Date(e.date).getTime()),
            );
            cycle.endDate = new Date(maxDate).toISOString().split('T')[0];
          }
          break;
        }
      }
    }

    return Array.from(cyclesMap.values()).sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );
  }
  private async applyScheduleChanges(changes: ScheduleChanges): Promise<void> {
    for (const creation of changes.eventsToCreate) {
      await this.createEventWithParticipant(
        creation.cycleId,
        creation.date,
        creation.staffId,
      );
    }

    for (const update of changes.eventsToUpdate) {
      await this.eventRepository.update(update.eventId, {
        eventDate: update.newDate,
      });
    }

    for (const deletion of changes.participantsToDelete) {
      await this.participantRepository.delete({
        eventId: deletion.eventId,
        staffId: deletion.staffId,
      });
    }
  }

  private async getAllCyclesWithEvents(): Promise<Cycle[]> {
    const allEvents = await this.eventRepository.find({
      where: { type: ScheduleType.OPENTALK },
      relations: ['cycle', 'eventParticipants'],
      order: { eventDate: 'ASC' },
    });

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
      const participant = event.eventParticipants?.[0];
      cycle.events.push({
        id: event.id,
        date: event.eventDate,
        staffId: participant?.staffId || 0,
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

  private async createEventWithParticipant(
    cycleId: number,
    eventDate: string,
    staffId: number,
  ): Promise<void> {
    const createdEvent = this.eventRepository.create({
      title: 'OpenTalk',
      type: ScheduleType.OPENTALK,
      cycleId: cycleId,
      eventDate: eventDate,
      status: EventStatus.ACTIVE,
    });
    const savedEvent = await this.eventRepository.save(createdEvent);

    await this.participantRepository.save({
      eventId: savedEvent.id,
      staffId: staffId,
    });
  }

  private async getHolidays(): Promise<Set<string>> {
    const holidays = await this.holidayRepository.find();
    return new Set(
      holidays.map((h) => new Date(h.date).toISOString().split('T')[0]),
    );
  }
  async handleNewStaff(
    staff: StaffEntity,
  ): Promise<{ before: Cycle[]; after: Cycle[] }> {
    this.logger.log(`Handling new staff onboarding: ${staff.email}`);

    const before = await this.getAllCyclesWithEvents();
    if (before.length === 0) return { before, after: [] };

    const holidays = await this.getHolidays();

    const changes = OpentalkStaffService.calculateNewStaffChanges(
      before,
      staff.id,
      holidays,
    );

    const after = OpentalkStaffService.applyChangesToCycles(before, changes);

    await this.applyScheduleChanges(changes);

    this.logger.log(`Successfully added ${staff.email} to opentalk schedules`);

    return { before, after };
  }

  async handleStaffLeave(
    staff: StaffEntity,
  ): Promise<{ before: Cycle[]; after: Cycle[] }> {
    this.logger.log(`Handling staff leaving: ${staff.email}`);

    const before = await this.getAllCyclesWithEvents();
    if (before.length === 0) return { before, after: [] };

    const holidays = await this.getHolidays();
    const today = getCurrentDateString();

    const changes = OpentalkStaffService.calculateStaffLeaveChanges(
      before,
      staff.id,
      today,
      holidays,
    );

    const after = OpentalkStaffService.applyChangesToCycles(before, changes);

    await this.applyScheduleChanges(changes);

    this.logger.log(`Successfully removed ${staff.email} from schedules`);

    return { before, after };
  }
}
