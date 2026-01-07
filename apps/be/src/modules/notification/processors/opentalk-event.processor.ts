import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationEventType } from '../enums/notification-event.enum';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { NotificationEvent } from '../services/notification.service';

@Injectable()
export class OpentalkEventProcessor {
  private readonly logger = new Logger(OpentalkEventProcessor.name);

  constructor(private readonly circuitBreaker: CircuitBreakerService) {}

  @OnEvent('notification.event.created')
  async handleNotificationEvent(event: NotificationEvent) {
    if (!this.isOpentalkEvent(event.eventType)) {
      return;
    }

    try {
      await this.circuitBreaker.execute(
        'opentalk-processor',
        async () => {
          await this.processOpentalkEvent(event);
        },
        { failureThreshold: 3, recoveryTimeout: 30000 },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process opentalk event ${event.id}`,
        error.stack,
      );
    }
  }

  private isOpentalkEvent(eventType: NotificationEventType): boolean {
    return eventType.startsWith('OPENTALK_');
  }

  private async processOpentalkEvent(event: NotificationEvent): Promise<void> {
    this.logger.log(`Processing opentalk event: ${event.eventType}`);

    switch (event.eventType) {
      case NotificationEventType.OPENTALK_EVENT_CREATED:
        await this.handleOpentalkCreated(event);
        break;
      case NotificationEventType.OPENTALK_EVENT_UPDATED:
        await this.handleOpentalkUpdated(event);
        break;
      case NotificationEventType.OPENTALK_EVENT_DELETED:
        await this.handleOpentalkDeleted(event);
        break;
      case NotificationEventType.OPENTALK_PARTICIPANTS_ASSIGNED:
        await this.handleParticipantsAssigned(event);
        break;
      case NotificationEventType.OPENTALK_PARTICIPANTS_SWAPPED:
        await this.handleParticipantsSwapped(event);
        break;
      default:
        this.logger.warn(`Unknown opentalk event type: ${event.eventType}`);
    }
  }

  private async handleOpentalkCreated(event: NotificationEvent): Promise<void> {
    const { payload } = event;
    this.logger.log(
      `OpenTalk event created: ${payload.title} on ${payload.date}`,
    );

    // Notify all eligible participants about new OpenTalk opportunity
    await this.notifyEligibleParticipants(payload);
  }

  private async handleOpentalkUpdated(event: NotificationEvent): Promise<void> {
    const { payload } = event;
    this.logger.log(`OpenTalk event updated: ${payload.title}`);

    // Notify current participants about updates
    await this.notifyCurrentParticipants(payload);
  }

  private async handleOpentalkDeleted(event: NotificationEvent): Promise<void> {
    const { payload } = event;
    this.logger.log(`OpenTalk event deleted: ${payload.title}`);

    // Notify participants about cancellation
    await this.notifyCancellation(payload);
  }

  private async handleParticipantsAssigned(
    event: NotificationEvent,
  ): Promise<void> {
    const { payload } = event;
    this.logger.log(`Participants assigned to OpenTalk: ${payload.eventId}`);

    // Notify newly assigned participants
    await this.notifyNewAssignments(payload);
  }

  private async handleParticipantsSwapped(
    event: NotificationEvent,
  ): Promise<void> {
    const { payload } = event;
    this.logger.log(`Participants swapped in OpenTalk: ${payload.eventId}`);

    // This is a complex event that affects multiple people
    await this.notifySwapParticipants(payload);
    await this.updateRelatedSchedules(payload);
  }

  private async notifyEligibleParticipants(payload: any): Promise<void> {
    // Logic to find and notify eligible participants
    this.logger.log(`Notifying eligible participants for: ${payload.title}`);
  }

  private async notifyCurrentParticipants(payload: any): Promise<void> {
    // Notify current participants about changes
    this.logger.log(
      `Notifying current participants about update: ${payload.title}`,
    );
  }

  private async notifyCancellation(payload: any): Promise<void> {
    // Handle cancellation notifications
    this.logger.log(`Notifying cancellation: ${payload.title}`);
  }

  private async notifyNewAssignments(payload: any): Promise<void> {
    // Notify newly assigned participants
    this.logger.log(`Notifying new assignments for event: ${payload.eventId}`);
  }

  private async notifySwapParticipants(payload: any): Promise<void> {
    // Complex logic for swap notifications
    this.logger.log(
      `Notifying swap participants for event: ${payload.eventId}`,
    );
  }

  private async updateRelatedSchedules(payload: any): Promise<void> {
    // Update related schedules when participants are swapped
    this.logger.log(
      `Updating related schedules after swap: ${payload.eventId}`,
    );
  }
}
