import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ScheduleType, SwapRequestStatus } from '@qnoffice/shared';
import ScheduleEventParticipantEntity from '@src/modules/schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';
import SwapRequestEntity from '@src/modules/swap-request/swap-request.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateSwapRequestDto } from './dtos/create-swap-request.dto';
import { ReviewSwapRequestDto } from './dtos/review-swap-request.dto';
import { SwapRequestQueryDto } from './dtos/swap-request-query.dto';

@Injectable()
export class SwapRequestService {
  constructor(
    @InjectRepository(SwapRequestEntity)
    private readonly swapRequestRepository: Repository<SwapRequestEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) { }

  async create(
    dto: CreateSwapRequestDto,
    requesterId?: number | null,
  ): Promise<SwapRequestEntity> {
    const existingRequest = await this.swapRequestRepository.findOne({
      where: [
        {
          fromEventId: dto.fromEventId,
          status: SwapRequestStatus.PENDING,
        },
        {
          toEventId: dto.fromEventId,
          status: SwapRequestStatus.PENDING,
        },
        {
          fromEventId: dto.toEventId,
          status: SwapRequestStatus.PENDING,
        },
        {
          toEventId: dto.toEventId,
          status: SwapRequestStatus.PENDING,
        },
      ],
    });

    if (existingRequest) {
      throw new BadRequestException(
        'One of the events is already involved in a pending swap request',
      );
    }

    const swapRequest = this.swapRequestRepository.create({
      ...dto,
      requesterId: requesterId || null,
      status: SwapRequestStatus.PENDING,
    });

    return this.swapRequestRepository.save(swapRequest);
  }

  async findAll(query: SwapRequestQueryDto): Promise<SwapRequestEntity[]> {
    const where: any = {};

    if (query.requesterId) {
      where.requesterId = query.requesterId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    return this.swapRequestRepository.find({
      where,
      relations: [
        'fromEvent',
        'toEvent',
        'requester',
        'requester.user',
        'fromEvent.eventParticipants',
        'fromEvent.eventParticipants.staff',
        'fromEvent.eventParticipants.staff.user',
        'toEvent.eventParticipants',
        'toEvent.eventParticipants.staff',
        'toEvent.eventParticipants.staff.user',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<SwapRequestEntity> {
    const swapRequest = await this.swapRequestRepository.findOne({
      where: { id },
      relations: [
        'fromEvent',
        'toEvent',
        'requester',
        'requester.user',
        'fromEvent.eventParticipants',
        'fromEvent.eventParticipants.staff',
        'fromEvent.eventParticipants.staff.user',
        'toEvent.eventParticipants',
        'toEvent.eventParticipants.staff',
        'toEvent.eventParticipants.staff.user',
      ],
    });

    if (!swapRequest) {
      throw new NotFoundException(`Swap request with ID ${id} not found`);
    }

    return swapRequest;
  }

  async findByUserId(userId: number): Promise<SwapRequestEntity[]> {
    return await this.swapRequestRepository.find({
      where: { requesterId: userId },
      relations: {
        requester: { user: true },
        fromEvent: {
          eventParticipants: {
            staff: { user: true }
          }
        },
        toEvent: {
          eventParticipants: {
            staff: { user: true }
          }
        }
      }
    });
  }

  async review(id: number, dto: ReviewSwapRequestDto) {
    const swapRequest = await this.swapRequestRepository.findOne({
      where: { id },
      relations: [
        'fromEvent',
        'toEvent',
        'fromEvent.eventParticipants',
        'toEvent.eventParticipants',
        'requester',
      ],
    });

    if (!swapRequest) {
      throw new NotFoundException(`Swap request with ID ${id} not found`);
    }

    if (swapRequest.type === ScheduleType.OPENTALK) {
      await this.handleReviewOpentalkSwap(swapRequest, dto);
    } else if (swapRequest.type === ScheduleType.CLEANING) {
      await this.handleReviewCleaningSwap(swapRequest, dto);
    }
  }

  async handleReviewOpentalkSwap(
    swapRequest: SwapRequestEntity,
    dto: ReviewSwapRequestDto,
  ): Promise<void> {
    if (
      swapRequest.type !== ScheduleType.OPENTALK ||
      !swapRequest.fromEvent ||
      !swapRequest.toEvent
    ) {
      return;
    }
    const fromDate = swapRequest.fromEvent.eventDate;
    const toDate = swapRequest.toEvent.eventDate;
    await this.entityManager.transaction(async (manager) => {
      if (dto.status === SwapRequestStatus.APPROVED) {
        await manager.update(ScheduleEventEntity, swapRequest.fromEvent.id, {
          eventDate: toDate,
        });
        await manager.update(ScheduleEventEntity, swapRequest.toEvent.id, {
          eventDate: fromDate,
        });
      }

      await manager.update(SwapRequestEntity, swapRequest.id, dto);
    });
  }

  async handleReviewCleaningSwap(
    swapRequest: SwapRequestEntity,
    dto: ReviewSwapRequestDto,
  ): Promise<void> {
    if (
      swapRequest.type !== ScheduleType.CLEANING ||
      !swapRequest.fromEvent ||
      !swapRequest.toEvent ||
      !swapRequest.requesterId
    ) {
      return;
    }

    const requesterId = swapRequest.requesterId;

    await this.entityManager.transaction(async (manager) => {
      if (dto.status === SwapRequestStatus.APPROVED) {
        const fromEventId = swapRequest.fromEvent.id;
        const toEventId = swapRequest.toEvent.id;

        let targetStaffId: number;

        if (swapRequest.targetStaffId) {
          targetStaffId = swapRequest.targetStaffId;
        } else {
          const toParticipants = swapRequest.toEvent.eventParticipants || [];
          const targetParticipant = toParticipants.find(
            (p) => p.staffId !== requesterId,
          );

          if (!targetParticipant) {
            throw new NotFoundException(
              'No other participant found in target event to swap with',
            );
          }

          targetStaffId = targetParticipant.staffId;
        }

        await manager.delete(ScheduleEventParticipantEntity, {
          eventId: fromEventId,
          staffId: requesterId,
        });
        await manager.delete(ScheduleEventParticipantEntity, {
          eventId: toEventId,
          staffId: targetStaffId,
        });

        await manager.save(ScheduleEventParticipantEntity, {
          eventId: toEventId,
          staffId: requesterId,
        });
        await manager.save(ScheduleEventParticipantEntity, {
          eventId: fromEventId,
          staffId: targetStaffId,
        });
      }

      await manager.update(SwapRequestEntity, swapRequest.id, dto);
    });
  }

  async delete(id: number): Promise<void> {
    const result = await this.swapRequestRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Swap request with ID ${id} not found`);
    }
  }
}
