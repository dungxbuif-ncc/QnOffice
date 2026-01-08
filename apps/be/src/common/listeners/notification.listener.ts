import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CleaningReminderPayload,
  NotificationEvent,
  OpentalkSlideReminderPayload,
  StaffChangePayload,
} from '@src/common/events/notification.events';
import { ChannelConfigService } from '@src/modules/channel/channel-config.service';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly channelConfigService: ChannelConfigService) {}

  @OnEvent(NotificationEvent.CLEANING_MORNING_REMINDER)
  async handleCleaningMorningReminder(payload: CleaningReminderPayload) {
    const channelId = await this.channelConfigService.getChannelId('CLEANING');
    this.logger.log(
      `[Bot Integration] Cleaning morning reminder: Channel ${channelId}, Event ${payload.eventId}, Participants: ${payload.participantEmails.join(', ')}`,
    );
  }

  @OnEvent(NotificationEvent.CLEANING_AFTERNOON_REMINDER)
  async handleCleaningAfternoonReminder(payload: CleaningReminderPayload) {
    const channelId = await this.channelConfigService.getChannelId('CLEANING');
    this.logger.log(
      `[Bot Integration] Cleaning afternoon reminder: Channel ${channelId}, Event ${payload.eventId}, Participants: ${payload.participantEmails.join(', ')}`,
    );
  }

  @OnEvent(NotificationEvent.CLEANING_NEXT_DAY_REMINDER)
  async handleCleaningNextDayReminder(payload: CleaningReminderPayload) {
    const channelId = await this.channelConfigService.getChannelId('CLEANING');
    this.logger.log(
      `[Bot Integration] Cleaning next day reminder: Channel ${channelId}, Event ${payload.eventId}, Date: ${payload.eventDate}, Participants: ${payload.participantEmails.join(', ')}`,
    );
  }

  @OnEvent(NotificationEvent.OPENTALK_SLIDE_REMINDER)
  async handleOpentalkSlideReminder(payload: OpentalkSlideReminderPayload) {
    const channelId = await this.channelConfigService.getChannelId('OPENTALK');
    this.logger.log(
      `[Bot Integration] Opentalk slide reminder: Channel ${channelId}, Event ${payload.eventId}, Days until: ${payload.daysUntilEvent}, Participant: ${payload.participantEmail}`,
    );
  }

  @OnEvent(NotificationEvent.OPENTALK_SLIDE_OVERDUE)
  async handleOpentalkSlideOverdue(payload: OpentalkSlideReminderPayload) {
    const channelId = await this.channelConfigService.getChannelId('OPENTALK');
    this.logger.log(
      `[Bot Integration] Opentalk slide OVERDUE: Channel ${channelId}, Event ${payload.eventId}, Participant: ${payload.participantEmail}`,
    );
  }

  @OnEvent(NotificationEvent.STAFF_ONBOARDING)
  async handleStaffOnboarding(payload: StaffChangePayload) {
    this.logger.log(
      `[Bot Integration] Staff onboarding: ${payload.staffEmail}, Affected schedules: ${payload.affectedSchedules.length}`,
    );
  }

  @OnEvent(NotificationEvent.STAFF_OFFBOARDING)
  async handleStaffOffboarding(payload: StaffChangePayload) {
    this.logger.log(
      `[Bot Integration] Staff offboarding: ${payload.staffEmail}, Affected schedules: ${payload.affectedSchedules.length}`,
    );
  }
}
