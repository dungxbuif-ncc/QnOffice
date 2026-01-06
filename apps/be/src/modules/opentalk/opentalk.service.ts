import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import ScheduleCycleEntity, {
  CycleStatus,
} from '../schedule/enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '../schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '../schedule/enties/schedule-event.entity';
import { CreateOpentalkCycleDto } from './dtos/create-opentalk-cycle.dto';
import { CreateOpentalkEventDto } from './dtos/create-opentalk-event.dto';
import CreateSwapRequestDto from './dtos/create-swap-request.dto';
import { OpentalkQueryDto } from './dtos/opentalk-query.dto';
import ReviewSwapRequestDto from './dtos/review-swap-request.dto';
import { SwapOpentalkDto } from './dtos/swap-opentalk.dto';
import SwapRequestEntity from './swap-request.entity';

@Injectable()
export class OpentalkService {
  constructor(
    @InjectRepository(ScheduleCycleEntity)
    private readonly cycleRepository: Repository<ScheduleCycleEntity>,
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(ScheduleEventParticipantEntity)
    private readonly participantRepository: Repository<ScheduleEventParticipantEntity>,
    @InjectRepository(SwapRequestEntity)
    private readonly swapRequestRepository: Repository<SwapRequestEntity>,
  ) {}

  // Cycle Management
  async createCycle(
    createCycleDto: CreateOpentalkCycleDto,
  ): Promise<ScheduleCycleEntity> {
    const cycleData = {
      ...createCycleDto,
      type: 'OPENTALK',
      status: createCycleDto.status
        ? (createCycleDto.status as CycleStatus)
        : CycleStatus.DRAFT,
    };
    const cycle = this.cycleRepository.create(cycleData);
    return this.cycleRepository.save(cycle);
  }

  async getCycles(status?: string): Promise<ScheduleCycleEntity[]> {
    const where: any = { type: 'OPENTALK' };
    if (status) {
      where.status = status as CycleStatus;
    }
    return this.cycleRepository.find({
      where,
      relations: [
        'events',
        'events.eventParticipants',
        'events.eventParticipants.staff',
        'events.eventParticipants.staff.user',
      ],
      order: {
        createdAt: 'DESC',
        events: {
          eventDate: 'ASC',
        },
      },
    });
  }

  async getCyclesWithEvents(status?: string): Promise<ScheduleCycleEntity[]> {
    const queryBuilder = this.cycleRepository
      .createQueryBuilder('cycle')
      .leftJoinAndSelect('cycle.events', 'events', 'events.type = :eventType', {
        eventType: 'OPENTALK',
      })
      .leftJoinAndSelect('events.eventParticipants', 'eventParticipants')
      .leftJoinAndSelect('eventParticipants.staff', 'staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('cycle.type = :type', { type: 'OPENTALK' })
      .orderBy('cycle.createdAt', 'DESC')
      .addOrderBy('events.eventDate', 'ASC');

    if (status) {
      queryBuilder.andWhere('cycle.status = :status', { status });
    }

    const cycles = await queryBuilder.getMany();
    //sort the cycle' ASC by last event date
    cycles.forEach((cycle) => {
      cycle.events.sort((a, b) =>
        a.eventDate > b.eventDate ? 1 : b.eventDate > a.eventDate ? -1 : 0,
      );
    });
    cycles.sort((a, b) => {
      const aLastEventDate =
        a.events.length > 0 ? a.events[a.events.length - 1].eventDate : '';
      const bLastEventDate =
        b.events.length > 0 ? b.events[b.events.length - 1].eventDate : '';
      return aLastEventDate > bLastEventDate
        ? 1
        : bLastEventDate > aLastEventDate
          ? -1
          : 0;
    });
    return cycles;
  }

  async getCycleById(id: number): Promise<ScheduleCycleEntity | null> {
    return this.cycleRepository.findOne({
      where: { id, type: 'OPENTALK' },
    });
  }

  async updateCycle(
    id: number,
    updateData: Partial<CreateOpentalkCycleDto>,
  ): Promise<ScheduleCycleEntity> {
    const processedData = {
      ...updateData,
      status: updateData.status
        ? (updateData.status as CycleStatus)
        : undefined,
    };
    await this.cycleRepository.update(id, processedData);
    const cycle = await this.getCycleById(id);
    if (!cycle) {
      throw new NotFoundException('Cycle not found');
    }
    return cycle;
  }

  async deleteCycle(id: number): Promise<void> {
    const result = await this.cycleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Cycle not found');
    }
  }

  // Event Management
  async createEvent(
    createEventDto: CreateOpentalkEventDto,
  ): Promise<ScheduleEventEntity> {
    const event = this.eventRepository.create({
      ...createEventDto,
      type: 'OPENTALK',
    });
    return this.eventRepository.save(event);
  }

  async getEvents(query: OpentalkQueryDto): Promise<ScheduleEventEntity[]> {
    // Use QueryBuilder for better relation loading with composite keys
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.cycle', 'cycle')
      .leftJoinAndSelect('event.eventParticipants', 'eventParticipants')
      .leftJoinAndSelect('eventParticipants.staff', 'staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('event.type = :type', { type: 'OPENTALK' });

    if (query.status) {
      queryBuilder.andWhere('event.status = :status', { status: query.status });
    }
    if (query.cycleId) {
      queryBuilder.andWhere('event.cycleId = :cycleId', {
        cycleId: query.cycleId,
      });
    }
    if (query.participantId) {
      queryBuilder.andWhere('eventParticipants.staffId = :participantId', {
        participantId: query.participantId,
      });
    }

    // Date range filter
    if (query.startDate) {
      queryBuilder.andWhere('event.eventDate >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }
    if (query.endDate) {
      queryBuilder.andWhere('event.eventDate <= :endDate', {
        endDate: new Date(query.endDate),
      });
    }

    const events = await queryBuilder
      .orderBy('event.eventDate', 'ASC')
      .getMany();

    return events;
  }

  async getEventsByCycle(cycleId: number): Promise<ScheduleEventEntity[]> {
    return this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.cycle', 'cycle')
      .leftJoinAndSelect('event.eventParticipants', 'eventParticipants')
      .leftJoinAndSelect('eventParticipants.staff', 'staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('event.cycleId = :cycleId', { cycleId })
      .andWhere('event.type = :type', { type: 'OPENTALK' })
      .orderBy('event.eventDate', 'ASC')
      .getMany();
  }

  async getEventById(id: number): Promise<ScheduleEventEntity | null> {
    return this.eventRepository.findOne({
      where: { id, type: 'OPENTALK' },
      relations: [
        'cycle',
        'eventParticipants',
        'eventParticipants.staff',
        'eventParticipants.staff.user',
      ],
    });
  }

  async updateEvent(
    id: number,
    updateData: Partial<CreateOpentalkEventDto>,
  ): Promise<ScheduleEventEntity> {
    await this.eventRepository.update(id, updateData);
    const event = await this.getEventById(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    const result = await this.eventRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Event not found');
    }
  }

  // Opentalk Specific Operations
  async swapParticipants(
    swapDto: SwapOpentalkDto,
  ): Promise<{ success: boolean; message: string }> {
    const [event1, event2] = await Promise.all([
      this.getEventById(swapDto.event1Id),
      this.getEventById(swapDto.event2Id),
    ]);

    if (!event1 || !event2) {
      throw new NotFoundException('One or both events not found');
    }

    // If both arrays are empty, swap all participants between events
    if (
      swapDto.participantsFrom1to2.length === 0 &&
      swapDto.participantsFrom2to1.length === 0
    ) {
      // Get current participants for both events
      const event1Participants = await this.participantRepository.find({
        where: { eventId: event1.id },
      });

      const event2Participants = await this.participantRepository.find({
        where: { eventId: event2.id },
      });

      // Remove all current participants
      await this.participantRepository.delete({ eventId: event1.id });
      await this.participantRepository.delete({ eventId: event2.id });

      // Add event1 participants to event2 and vice versa
      await Promise.all([
        ...event1Participants.map((p) =>
          this.participantRepository.save({
            eventId: event2.id,
            staffId: p.staffId,
          }),
        ),
        ...event2Participants.map((p) =>
          this.participantRepository.save({
            eventId: event1.id,
            staffId: p.staffId,
          }),
        ),
      ]);
    } else {
      // Handle specific participant swapping (original logic)
      // Remove participants from event1 that are moving to event2
      await Promise.all(
        swapDto.participantsFrom1to2.map((staffId) =>
          this.participantRepository.delete({ eventId: event1.id, staffId }),
        ),
      );

      // Remove participants from event2 that are moving to event1
      await Promise.all(
        swapDto.participantsFrom2to1.map((staffId) =>
          this.participantRepository.delete({ eventId: event2.id, staffId }),
        ),
      );

      // Add participants from event1 to event2
      await Promise.all(
        swapDto.participantsFrom1to2.map((staffId) =>
          this.participantRepository.save({ eventId: event2.id, staffId }),
        ),
      );

      // Add participants from event2 to event1
      await Promise.all(
        swapDto.participantsFrom2to1.map((staffId) =>
          this.participantRepository.save({ eventId: event1.id, staffId }),
        ),
      );
    }

    return {
      success: true,
      message: 'Participants swapped successfully',
    };
  }

  async getSpreadsheetData(cycleId?: number): Promise<any> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.cycle', 'cycle')
      .leftJoinAndSelect('event.eventParticipants', 'eventParticipants')
      .leftJoinAndSelect('eventParticipants.staff', 'staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('event.type = :type', { type: 'OPENTALK' });

    if (cycleId) {
      queryBuilder.andWhere('event.cycleId = :cycleId', { cycleId });
    }

    const events = await queryBuilder
      .orderBy('event.eventDate', 'ASC')
      .getMany();

    // Group by cycle
    const groupedByCycle = events.reduce((acc, event) => {
      const cycleKey = event.cycleId;
      if (!acc[cycleKey]) {
        acc[cycleKey] = {
          cycle: event.cycle,
          events: [],
        };
      }
      acc[cycleKey].events.push(event);
      return acc;
    }, {});

    return Object.values(groupedByCycle);
  }

  async bulkAssignParticipants(assignmentData: {
    cycleId: number;
    assignments: Array<{ eventId: number; participantIds: number[] }>;
  }): Promise<ScheduleEventEntity[]> {
    // First, remove all existing participants for the events
    const eventIds = assignmentData.assignments.map((a) => a.eventId);
    await this.participantRepository.delete({
      eventId: In(eventIds),
    });

    // Then add new participants
    const participantRecords = assignmentData.assignments.flatMap(
      (assignment) =>
        assignment.participantIds.map((staffId) => ({
          eventId: assignment.eventId,
          staffId,
        })),
    );

    if (participantRecords.length > 0) {
      await this.participantRepository.save(participantRecords);
    }

    return this.getEventsByCycle(assignmentData.cycleId);
  }

  async checkConflicts(cycleId?: number): Promise<any[]> {
    const where: any = { type: 'OPENTALK' };
    if (cycleId) {
      where.cycleId = cycleId;
    }

    const events = await this.eventRepository.find({
      where,
      relations: ['eventParticipants'],
      order: { eventDate: 'ASC' },
    });

    const conflicts: any[] = [];
    const participantSchedule: { [key: number]: ScheduleEventEntity[] } = {};

    // Build participant schedule map
    events.forEach((event) => {
      event.eventParticipants.forEach((participant) => {
        const staffId = participant.staffId;
        if (!participantSchedule[staffId]) {
          participantSchedule[staffId] = [];
        }
        participantSchedule[staffId].push(event);
      });
    });

    // Check for conflicts (same participant in multiple events on same day)
    Object.entries(participantSchedule).forEach(([participantId, events]) => {
      const eventsByDate: { [key: string]: ScheduleEventEntity[] } = {};

      events.forEach((event) => {
        const dateKey = event.eventDate;
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push(event);
      });

      Object.entries(eventsByDate).forEach(([date, dayEvents]) => {
        if (dayEvents.length > 1) {
          conflicts.push({
            participantId: Number(participantId),
            date,
            conflictingEvents: dayEvents.map((e) => ({
              id: e.id,
              title: e.title,
              eventDate: e.eventDate,
            })),
          });
        }
      });
    });

    return conflicts;
  }

  // Swap Request Management
  async createSwapRequest(
    createSwapRequestDto: CreateSwapRequestDto,
    requesterId: number,
  ): Promise<SwapRequestEntity> {
    // Validate that the requester is participating in the original event
    const participant = await this.participantRepository.findOne({
      where: {
        eventId: createSwapRequestDto.scheduleId,
        staffId: requesterId,
      },
    });

    if (!participant) {
      throw new NotFoundException('You are not participating in this event');
    }

    // Find available slots or create a general swap request
    const toEventId = createSwapRequestDto.scheduleId; // For now, use the same event ID

    const swapRequest = this.swapRequestRepository.create({
      fromEventId: createSwapRequestDto.scheduleId,
      toEventId,
      requesterId,
      reason: createSwapRequestDto.reason,
    });

    return this.swapRequestRepository.save(swapRequest);
  }

  async getSwapRequests(filters?: {
    requesterId?: number;
    status?: string;
  }): Promise<SwapRequestEntity[]> {
    const queryBuilder = this.swapRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.fromEvent', 'fromEvent')
      .leftJoinAndSelect('request.toEvent', 'toEvent')
      .leftJoinAndSelect('request.requester', 'requester')
      .orderBy('request.createdAt', 'DESC');

    if (filters?.requesterId) {
      queryBuilder.andWhere('request.requesterId = :requesterId', {
        requesterId: filters.requesterId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('request.status = :status', {
        status: filters.status,
      });
    }

    return queryBuilder.getMany();
  }

  async reviewSwapRequest(
    requestId: number,
    reviewDto: ReviewSwapRequestDto,
  ): Promise<SwapRequestEntity> {
    const swapRequest = await this.swapRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!swapRequest) {
      throw new NotFoundException('Swap request not found');
    }

    swapRequest.status = reviewDto.status as any;
    swapRequest.reviewNote = reviewDto.reviewNote;
    swapRequest.updatedAt = new Date();

    // If approved, we would implement the actual participant swap here
    // For now, just save the status
    return this.swapRequestRepository.save(swapRequest);
  }

  async getUserSchedules(userId: number): Promise<ScheduleEventEntity[]> {
    // Find staff for this user
    const participantEvents = await this.participantRepository
      .createQueryBuilder('participant')
      .leftJoinAndSelect('participant.event', 'event')
      .leftJoinAndSelect('participant.staff', 'staff')
      .where('staff.userId = :userId', { userId })
      .andWhere('event.type = :type', { type: 'OPENTALK' })
      .andWhere('event.status = :status', { status: 'ACTIVE' })
      .getMany();

    return participantEvents.map((p) => p.event);
  }
}
