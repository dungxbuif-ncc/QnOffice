import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { EventStatus, ScheduleType } from '@qnoffice/shared';
import {
  CleaningReminderPayload,
  NotificationEvent,
} from '@src/common/events/notification.events';
import { getCurrentDateString } from '@src/common/utils/date.utils';
import { addDays } from 'date-fns';
import { LessThan, Repository } from 'typeorm';
import ScheduleEventEntity from '../enties/schedule-event.entity';

@Injectable()
export class CleaningCronService {
  private readonly logger = new Logger(CleaningCronService.name);

  constructor(
    @InjectRepository(ScheduleEventEntity)
    private readonly eventRepository: Repository<ScheduleEventEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async markPastEventsCompleted(): Promise<void> {
    this.logger.log('Running: Mark past cleaning events as completed');

    const today = getCurrentDateString();

    const result = await this.eventRepository.update(
      {
        type: ScheduleType.CLEANING,
        eventDate: LessThan(today),
        status: EventStatus.ACTIVE,
      },
      {
        status: EventStatus.COMPLETED,
      },
    );

    this.logger.log(`Marked ${result.affected} cleaning events as completed`);
  }

  async sendMorningReminder(): Promise<void> {
    this.logger.log('Running: Send cleaning morning reminder at 8h UTC+7');

    const today = getCurrentDateString();

    const todayEvents = await this.eventRepository.find({
      where: {
        type: ScheduleType.CLEANING,
        eventDate: today,
        status: EventStatus.ACTIVE,
      },
      relations: ['eventParticipants', 'eventParticipants.staff'],
    });

    for (const event of todayEvents) {
      const participants = event.eventParticipants || [];
      const participantIds = participants.map((p) => p.staffId);
      const participantEmails = participants
        .map((p) => p.staff?.email)
        .filter(Boolean) as string[];

      if (participantIds.length > 0) {
        const payload: CleaningReminderPayload = {
          eventId: event.id,
          eventDate: event.eventDate,
          participantIds,
          participantEmails,
          type: 'morning',
        };
        this.logger.log(
          `Sending cleaning morning reminder for event ${event.id}`,
        );
        this.eventEmitter.emit(
          NotificationEvent.CLEANING_MORNING_REMINDER,
          payload,
        );
      }
    }

    this.logger.log(
      `Sent morning reminders for ${todayEvents.length} cleaning events`,
    );
  }

  async sendAfternoonReminder(): Promise<void> {
    this.logger.log('Running: Send cleaning afternoon reminder at 17h UTC+7');

    const today = getCurrentDateString();
    const tomorrow = addDays(new Date(today), 1).toISOString().split('T')[0];

    const todayEvents = await this.eventRepository.find({
      where: {
        type: ScheduleType.CLEANING,
        eventDate: today,
        status: EventStatus.ACTIVE,
      },
      relations: ['eventParticipants', 'eventParticipants.staff'],
    });

    for (const event of todayEvents) {
      const participants = event.eventParticipants || [];
      const participantIds = participants.map((p) => p.staffId);
      const participantEmails = participants
        .map((p) => p.staff?.email)
        .filter(Boolean) as string[];

      if (participantIds.length > 0) {
        const payload: CleaningReminderPayload = {
          eventId: event.id,
          eventDate: event.eventDate,
          participantIds,
          participantEmails,
          type: 'afternoon',
        };
        this.logger.log(
          `Sending cleaning afternoon reminder for event ${event.id}`,
        );
        this.eventEmitter.emit(
          NotificationEvent.CLEANING_AFTERNOON_REMINDER,
          payload,
        );
      }
    }

    const tomorrowEvents = await this.eventRepository.find({
      where: {
        type: ScheduleType.CLEANING,
        eventDate: tomorrow,
        status: EventStatus.ACTIVE,
      },
      relations: ['eventParticipants', 'eventParticipants.staff'],
    });

    for (const event of tomorrowEvents) {
      const participants = event.eventParticipants || [];
      const participantIds = participants.map((p) => p.staffId);
      const participantEmails = participants
        .map((p) => p.staff?.email)
        .filter(Boolean) as string[];

      if (participantIds.length > 0) {
        const payload: CleaningReminderPayload = {
          eventId: event.id,
          eventDate: event.eventDate,
          participantIds,
          participantEmails,
          type: 'nextday',
        };
        this.logger.log(
          `Sending cleaning next day reminder for event ${event.id}`,
        );
        this.eventEmitter.emit(
          NotificationEvent.CLEANING_NEXT_DAY_REMINDER,
          payload,
        );
      }
    }

    this.logger.log(
      `Sent afternoon reminders for ${todayEvents.length} events and next day reminders for ${tomorrowEvents.length} events`,
    );
  }
}
