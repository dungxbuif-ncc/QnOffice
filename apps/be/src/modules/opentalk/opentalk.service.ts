import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CycleStatus,
  EventStatus,
  OpentalkSlideStatus,
  ScheduleType,
  SearchOrder,
} from '@qnoffice/shared';
import { SubmitSlideDto } from '@src/modules/opentalk/dtos/submit-slide.dto';
import { FindOptionsWhere, Repository } from 'typeorm';
import ScheduleCycleEntity from '../schedule/enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '../schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '../schedule/enties/schedule-event.entity';
import SwapRequestEntity from '../schedule/enties/swap-request.entity';
import { CreateOpentalkCycleDto } from './dtos/create-opentalk-cycle.dto';
import { CreateOpentalkEventDto } from './dtos/create-opentalk-event.dto';
import CreateSwapRequestDto from './dtos/create-swap-request.dto';
import { OpentalkQueryDto } from './dtos/opentalk-query.dto';
import { SwapOpentalkDto } from './dtos/swap-opentalk.dto';

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

  async getCycles(status?: string): Promise<ScheduleCycleEntity[]> {
    const where: FindOptionsWhere<ScheduleCycleEntity> = {
      type: ScheduleType.OPENTALK,
    };
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
        createdAt: SearchOrder.ASC,
        events: {
          eventDate: SearchOrder.ASC,
        },
      },
    });
  }

  async getCycleById(id: number): Promise<ScheduleCycleEntity | null> {
    return this.cycleRepository.findOne({
      where: { id, type: ScheduleType.OPENTALK },
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
      type: ScheduleType.OPENTALK,
    });
    const savedEvent = await this.eventRepository.save(event);
    return savedEvent;
  }

  async getEvents(query: OpentalkQueryDto): Promise<ScheduleEventEntity[]> {
    const events = await this.eventRepository.find({
      where: { type: ScheduleType.OPENTALK },
      relations: [
        'cycle',
        'eventParticipants',
        'eventParticipants.staff',
        'eventParticipants.staff.user',
      ],
      order: { eventDate: 'ASC' },
    });

    // Apply filters in memory
    let filtered = events;

    if (query.status) {
      filtered = filtered.filter((e) => e.status === query.status);
    }
    if (query.cycleId) {
      filtered = filtered.filter((e) => e.cycleId === query.cycleId);
    }
    if (query.participantId) {
      filtered = filtered.filter((e) =>
        e.eventParticipants?.some((p) => p.staffId === query.participantId),
      );
    }

    return filtered;
  }

  async getEventsByCycle(cycleId: number): Promise<ScheduleEventEntity[]> {
    return this.eventRepository.find({
      where: {
        cycleId,
        type: ScheduleType.OPENTALK,
      },
      relations: [
        'cycle',
        'eventParticipants',
        'eventParticipants.staff',
        'eventParticipants.staff.user',
      ],
      order: { eventDate: 'ASC' },
    });
  }

  async getEventById(id: number): Promise<ScheduleEventEntity | null> {
    return this.eventRepository.findOne({
      where: { id, type: ScheduleType.OPENTALK },
      relations: [
        'cycle',
        'eventParticipants',
        'eventParticipants.staff',
        'eventParticipants.staff.user',
      ],
    });
  }

  async submitSlide(payload: SubmitSlideDto): Promise<void> {
    const event = await this.getEventById(payload.eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    let slideKey = payload.slidesUrl;
    try {
      const url = new URL(payload.slidesUrl);
      slideKey = url.pathname.substring(1);
    } catch (e) {
      slideKey = payload.slidesUrl;
    }

    await this.eventRepository.update(payload.eventId, {
      metadata: {
        slideKey: slideKey,
        status: OpentalkSlideStatus.PENDING,
      },
    });
  }

  async updateEvent(
    id: number,
    updateData: Partial<CreateOpentalkEventDto>,
  ): Promise<ScheduleEventEntity> {
    const { participantIds, ...entityData } = updateData;
    await this.eventRepository.update(id, entityData);
    const event = await this.getEventById(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    const event = await this.getEventById(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.eventRepository.remove(event);
  }

  async swapOpentalk(swapDto: SwapOpentalkDto): Promise<void> {
    const [event1, event2] = await Promise.all([
      this.getEventById(swapDto.event1Id),
      this.getEventById(swapDto.event2Id),
    ]);

    if (!event1 || !event2) {
      throw new NotFoundException('One or both events not found');
    }

    if (event1.cycleId !== event2.cycleId) {
      throw new BadRequestException(
        'Events must belong to the same cycle to swap',
      );
    }

    if (
      event1.status === EventStatus.COMPLETED ||
      event2.status === EventStatus.COMPLETED
    ) {
      throw new ConflictException('Cannot swap completed events');
    }

    const tempDate = event1.eventDate;
    event1.eventDate = event2.eventDate;
    event2.eventDate = tempDate;

    await this.eventRepository.save([event1, event2]);
  }

  async getSpreadsheetData(cycleId?: number): Promise<any> {
    const where: any = { type: ScheduleType.OPENTALK };
    if (cycleId) {
      where.cycleId = cycleId;
    }

    const events = await this.eventRepository.find({
      where,
      relations: [
        'cycle',
        'eventParticipants',
        'eventParticipants.staff',
        'eventParticipants.staff.user',
      ],
      order: { eventDate: 'ASC' },
    });

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
    const where: any = {};
    if (filters?.requesterId) {
      where.requesterId = filters.requesterId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.swapRequestRepository.find({
      where,
      relations: ['fromEvent', 'toEvent', 'requester'],
      order: { createdAt: 'DESC' },
    });
  }
}
