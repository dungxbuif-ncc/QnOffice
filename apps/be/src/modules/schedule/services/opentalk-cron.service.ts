import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { EventStatus, ScheduleType } from '@qnoffice/shared';
import {
  NotificationEvent,
  OpentalkSlideReminderPayload,
} from '@src/common/events/notification.events';
import { getCurrentDateString } from '@src/common/utils/date.utils';
import { differenceInDays } from 'date-fns';
import { LessThan, Repository } from 'typeorm';
import OpentalkSlideEntity, {
  SlideStatus,
} from '../enties/opentalk-slide.entity';
import ScheduleEventEntity from '../enties/schedule-event.entity';

@Injectable()
export class OpentalkCronService {
  private readonly logger = new Logger(OpentalkCronService.name);

  constructor(
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    @InjectRepository(OpentalkSlideEntity)
    private readonly slideRepository: Repository<OpentalkSlideEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async markPastEventsCompleted(): Promise<void> {
    this.logger.log('Running: Mark past opentalk events as completed');

    const today = getCurrentDateString();

    const result = await this.eventRepository.update(
      {
        type: ScheduleType.OPENTALK,
        eventDate: LessThan(today),
        status: EventStatus.ACTIVE,
      },
      {
        status: EventStatus.COMPLETED,
      },
    );

    this.logger.log(`Marked ${result.affected} opentalk events as completed`);
  }

  async checkSlideSubmission(): Promise<void> {
    this.logger.log('Running: Check opentalk slide submission at 9h UTC+7');

    const today = new Date(getCurrentDateString());

    const upcomingEvents = await this.eventRepository.find({
      where: {
        type: ScheduleType.OPENTALK,
        status: EventStatus.ACTIVE,
      },
      relations: ['eventParticipants', 'eventParticipants.staff'],
      order: { eventDate: 'ASC' },
    });

    for (const event of upcomingEvents) {
      const eventDate = new Date(event.eventDate);
      const daysUntil = differenceInDays(eventDate, today);

      if (daysUntil < 0) continue;

      const participant = event.eventParticipants?.[0];
      if (!participant?.staff) continue;

      const slide = await this.slideRepository.findOne({
        where: { eventId: event.id },
      });

      const slideSubmitted =
        slide?.status === SlideStatus.APPROVED ||
        slide?.status === SlideStatus.SUBMITTED;

      if (daysUntil === 7 && !slideSubmitted) {
        const payload: OpentalkSlideReminderPayload = {
          eventId: event.id,
          eventDate: event.eventDate,
          participantId: participant.staffId,
          participantEmail: participant.staff.email,
          daysUntilEvent: 7,
          slideSubmitted: false,
        };
        this.logger.log(
          `Sending opentalk slide reminder for event ${event.id} (7 days)`,
        );
        this.eventEmitter.emit(
          NotificationEvent.OPENTALK_SLIDE_REMINDER,
          payload,
        );
      } else if (daysUntil === 3 && !slideSubmitted) {
        const payload: OpentalkSlideReminderPayload = {
          eventId: event.id,
          eventDate: event.eventDate,
          participantId: participant.staffId,
          participantEmail: participant.staff.email,
          daysUntilEvent: 3,
          slideSubmitted: false,
        };
        this.logger.log(
          `Sending opentalk slide reminder for event ${event.id} (3 days)`,
        );
        this.eventEmitter.emit(
          NotificationEvent.OPENTALK_SLIDE_REMINDER,
          payload,
        );
      } else if (daysUntil === 1 && !slideSubmitted) {
        const payload: OpentalkSlideReminderPayload = {
          eventId: event.id,
          eventDate: event.eventDate,
          participantId: participant.staffId,
          participantEmail: participant.staff.email,
          daysUntilEvent: 1,
          slideSubmitted: false,
        };
        this.logger.log(`Sending opentalk slide overdue for event ${event.id}`);
        this.eventEmitter.emit(
          NotificationEvent.OPENTALK_SLIDE_OVERDUE,
          payload,
        );
      }
    }

    this.logger.log('Completed opentalk slide submission check');
  }
}
