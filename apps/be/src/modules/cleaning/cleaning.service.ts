import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { CycleStatus, EventStatus, ScheduleType } from '@qnoffice/shared';
import { formatVn, nowVn } from '@src/common/utils/time.util';
import { CleaningQueryDto } from '@src/modules/cleaning/dtos/cleaning-query.dto';
import { CreateCleaningCycleDto } from '@src/modules/cleaning/dtos/create-cleaning-cycle.dto';
import { CreateCleaningEventDto } from '@src/modules/cleaning/dtos/create-cleaning-event.dto';
import {
  EntityManager,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import ScheduleCycleEntity from '../schedule/enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '../schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '../schedule/enties/schedule-event.entity';
import { findActiveCycle } from '../schedule/schedule.utils';
@Injectable()
export class CleaningService {
  constructor(
    @InjectRepository(ScheduleCycleEntity)
    private readonly cycleRepository: Repository<ScheduleCycleEntity>,
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(ScheduleEventParticipantEntity)
    private readonly participantRepository: Repository<ScheduleEventParticipantEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async createCycle(
    createCycleDto: CreateCleaningCycleDto,
  ): Promise<ScheduleCycleEntity> {
    const cycleData = {
      ...createCycleDto,
      type: ScheduleType.CLEANING,
      status: createCycleDto.status
        ? (createCycleDto.status as CycleStatus)
        : CycleStatus.DRAFT,
    };
    const cycle = this.cycleRepository.create(cycleData);
    return this.cycleRepository.save(cycle);
  }

  async getCycles(status?: string): Promise<ScheduleCycleEntity[]> {
    const where: any = { type: ScheduleType.CLEANING };
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
        eventType: 'CLEANING',
      })
      .leftJoinAndSelect('events.eventParticipants', 'eventParticipants')
      .leftJoinAndSelect('eventParticipants.staff', 'staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('cycle.type = :type', { type: 'CLEANING' })
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

  async getActiveCycle(): Promise<ScheduleCycleEntity | null> {
    const todayString = formatVn(nowVn(), 'yyyy-MM-dd');

    const recentEvent = await this.eventRepository.findOne({
      where: {
        type: ScheduleType.CLEANING,
        eventDate: LessThanOrEqual(todayString),
      },
      order: { eventDate: 'DESC' },
    });

    if (!recentEvent) {
      return null;
    }
    const cycle = await this.cycleRepository.findOne({
      where: { id: recentEvent.cycleId },
      relations: ['events'],
    });
    if (!cycle) {
      return null;
    }
    return findActiveCycle([cycle], todayString);
  }

  async getFutureEvents(): Promise<ScheduleEventEntity[]> {
    const todayString = formatVn(nowVn(), 'yyyy-MM-dd');
    return this.eventRepository.find({
      where: {
        type: ScheduleType.CLEANING,
        eventDate: MoreThanOrEqual(todayString),
      },
      relations: ['eventParticipants'],
      order: { eventDate: 'ASC' },
    });
  }

  async getCycleById(id: number): Promise<ScheduleCycleEntity | null> {
    return this.cycleRepository.findOne({
      where: { id, type: ScheduleType.CLEANING },
    });
  }

  async updateCycle(
    id: number,
    updateData: Partial<CreateCleaningCycleDto>,
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
    createEventDto: CreateCleaningEventDto,
  ): Promise<ScheduleEventEntity> {
    const { participantIds, status, ...eventData } = createEventDto;

    const event = this.eventRepository.create({
      ...eventData,
      type: ScheduleType.CLEANING,
      status: status as EventStatus,
    });

    const savedEvent = await this.eventRepository.save(event);

    if (participantIds?.length) {
      const participants = participantIds.map((staffId) =>
        this.participantRepository.create({
          eventId: savedEvent.id,
          staffId,
        }),
      );
      await this.participantRepository.save(participants);
    }

    return savedEvent;
  }

  async getEvents(query: CleaningQueryDto): Promise<ScheduleEventEntity[]> {
    // Use QueryBuilder for better relation loading with composite keys
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.cycle', 'cycle')
      .leftJoinAndSelect('event.eventParticipants', 'eventParticipants')
      .leftJoinAndSelect('eventParticipants.staff', 'staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('event.type = :type', { type: 'CLEANING' });

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
      .andWhere('event.type = :type', { type: 'CLEANING' })
      .orderBy('event.eventDate', 'ASC')
      .getMany();
  }

  async getCycleEventsByEventId(
    eventId: number,
  ): Promise<ScheduleEventEntity[]> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      select: ['cycleId'],
    });

    if (!event) {
      throw new Error('Event not found');
    }

    return this.getEventsByCycle(event.cycleId);
  }

  async getEventById(id: number): Promise<ScheduleEventEntity | null> {
    return this.eventRepository.findOne({
      where: { id, type: ScheduleType.CLEANING },
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
    updateData: Partial<CreateCleaningEventDto>,
  ): Promise<ScheduleEventEntity> {
    const { participantIds, ...entityData } = updateData;
    const updatePayload = { ...entityData };
    if (updatePayload.status) {
      (updatePayload as any).status = updatePayload.status as EventStatus;
    }
    await this.eventRepository.update(
      id,
      updatePayload as Partial<ScheduleEventEntity>,
    );
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

  async getSpreadsheetData(cycleId?: number): Promise<any> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.cycle', 'cycle')
      .leftJoinAndSelect('event.eventParticipants', 'eventParticipants')
      .leftJoinAndSelect('eventParticipants.staff', 'staff')
      .leftJoinAndSelect('staff.user', 'user')
      .where('event.type = :type', { type: 'CLEANING' });

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

  async swapEventParticipants(
    participant1: { eventId: number; staffId: number },
    participant2: { eventId: number; staffId: number },
  ): Promise<void> {
    const p1 = await this.participantRepository.findOne({
      where: {
        eventId: participant1.eventId,
        staffId: participant1.staffId,
        event: { type: ScheduleType.CLEANING },
      },
      relations: ['event'],
    });

    const p2 = await this.participantRepository.findOne({
      where: {
        eventId: participant2.eventId,
        staffId: participant2.staffId,
        event: { type: ScheduleType.CLEANING },
      },
      relations: ['event'],
    });

    if (!p1 || !p2) {
      throw new NotFoundException('One or both participants not found');
    }
    if (p1.event.id === p2.event.id) {
      throw new NotFoundException(
        'Cannot swap participants within the same event',
      );
    }

    if (p1.event.cycleId !== p2.event.cycleId) {
      throw new NotFoundException('One or both events are not cleaning events');
    }

    await this.entityManager.transaction(async (manager) => {
      await manager.delete(ScheduleEventParticipantEntity, {
        eventId: p1.eventId,
        staffId: p1.staffId,
      });

      await manager.delete(ScheduleEventParticipantEntity, {
        eventId: p2.eventId,
        staffId: p2.staffId,
      });

      await manager.insert(ScheduleEventParticipantEntity, [
        {
          eventId: p1.eventId,
          staffId: participant2.staffId,
        },
        {
          eventId: p2.eventId,
          staffId: participant1.staffId,
        },
      ]);
    });
  }
}
