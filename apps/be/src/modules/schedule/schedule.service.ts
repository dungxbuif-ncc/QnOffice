import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CycleStatus, EventStatus } from '@qnoffice/shared';
import { toDateString } from '@src/common/utils/date.utils';
import { Repository } from 'typeorm';
import { CreateCycleDto } from './dtos/create-cycle.dto';
import { CreateEventDto } from './dtos/create-event.dto';
import { ScheduleQueryDto } from './dtos/schedule-query.dto';
import ScheduleCycleEntity from './enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from './enties/schedule-event-participant.entity';
import ScheduleEventEntity from './enties/schedule-event.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ScheduleCycleEntity)
    private cycleRepository: Repository<ScheduleCycleEntity>,
    @InjectRepository(ScheduleEventEntity)
    private eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(ScheduleEventParticipantEntity)
    private participantRepository: Repository<ScheduleEventParticipantEntity>,
  ) {}

  // Cycle Management
  async createCycle(
    createCycleDto: CreateCycleDto,
  ): Promise<ScheduleCycleEntity> {
    const cycle = this.cycleRepository.create({
      name: createCycleDto.name,
      type: createCycleDto.type,
      description: createCycleDto.description,
      status: CycleStatus.DRAFT,
    });

    return this.cycleRepository.save(cycle);
  }

  async getCycles(type?: string): Promise<ScheduleCycleEntity[]> {
    const queryBuilder = this.cycleRepository.createQueryBuilder('cycle');

    if (type) {
      queryBuilder.where('cycle.type = :type', { type });
    }

    return queryBuilder.orderBy('cycle.createdAt', 'DESC').getMany();
  }

  async getCycleById(id: number): Promise<ScheduleCycleEntity | null> {
    return this.cycleRepository.findOne({ where: { id } });
  }

  // Event Management
  async createEvent(
    createEventDto: CreateEventDto,
  ): Promise<ScheduleEventEntity> {
    const { participantIds, ...entityData } = createEventDto;
    const event = this.eventRepository.create({
      ...entityData,
      eventDate: createEventDto.eventDate,
      status: EventStatus.PENDING,
    });

    return this.eventRepository.save(event);
  }

  async getEvents(
    query: ScheduleQueryDto = {},
  ): Promise<ScheduleEventEntity[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.cycle', 'cycle')
      .leftJoinAndSelect('event.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'user')
      .leftJoinAndSelect('participants.branch', 'branch');

    if (query.type) {
      queryBuilder.andWhere('event.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('event.status = :status', { status: query.status });
    }

    if (query.cycleId) {
      queryBuilder.andWhere('event.cycleId = :cycleId', {
        cycleId: query.cycleId,
      });
    }

    if (query.startDate && query.endDate) {
      queryBuilder.andWhere('event.eventDate BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    }

    return queryBuilder.orderBy('event.eventDate', 'ASC').getMany();
  }

  async getEventsByCycle(cycleId: number): Promise<ScheduleEventEntity[]> {
    return this.eventRepository.find({
      where: { cycleId },
      relations: ['participants', 'participants.user', 'participants.branch'],
      order: { eventDate: 'ASC' },
    });
  }

  async updateEvent(
    id: number,
    updateData: Partial<CreateEventDto>,
  ): Promise<ScheduleEventEntity> {
    const { participantIds, ...entityData } = updateData;
    if (entityData.eventDate) {
      // Ensure date is stored as datestring (YYYY-MM-DD) without time
      entityData.eventDate =
        typeof entityData.eventDate === 'string'
          ? entityData.eventDate
          : (toDateString(new Date(entityData.eventDate)) as any);
    }

    await this.eventRepository.update(id, entityData);
    const updatedEvent = await this.getEventById(id);
    if (!updatedEvent) {
      throw new Error('Event not found after update');
    }
    return updatedEvent;
  }

  async getEventById(id: number): Promise<ScheduleEventEntity | null> {
    return this.eventRepository.findOne({
      where: { id },
      relations: [
        'cycle',
        'participants',
        'participants.user',
        'participants.branch',
      ],
    });
  }

  async deleteEvent(id: number): Promise<void> {
    await this.eventRepository.delete(id);
  }

  async swapEventParticipants(
    event1Id: number,
    event2Id: number,
  ): Promise<void> {
    const event1 = await this.getEventById(event1Id);
    const event2 = await this.getEventById(event2Id);

    if (!event1 || !event2) {
      throw new Error('One or both events not found');
    }

    // Get current participants for both events
    const event1Participants = await this.participantRepository.find({
      where: { eventId: event1.id },
    });
    const event2Participants = await this.participantRepository.find({
      where: { eventId: event2.id },
    });

    // Remove all existing participants
    if (event1Participants.length > 0) {
      await this.participantRepository.remove(event1Participants);
    }
    if (event2Participants.length > 0) {
      await this.participantRepository.remove(event2Participants);
    }

    // Create new participants with swapped assignments
    const newEvent1Participants = event2Participants.map((p) =>
      this.participantRepository.create({
        eventId: event1.id,
        staffId: p.staffId,
      }),
    );
    const newEvent2Participants = event1Participants.map((p) =>
      this.participantRepository.create({
        eventId: event2.id,
        staffId: p.staffId,
      }),
    );

    // Save new participants
    if (newEvent1Participants.length > 0) {
      await this.participantRepository.save(newEvent1Participants);
    }
    if (newEvent2Participants.length > 0) {
      await this.participantRepository.save(newEvent2Participants);
    }
  }
}
