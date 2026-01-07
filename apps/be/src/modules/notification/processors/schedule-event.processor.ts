import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationEventType } from '../enums/notification-event.enum';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { NotificationEvent } from '../services/notification.service';

@Injectable()
export class ScheduleEventProcessor {
  private readonly logger = new Logger(ScheduleEventProcessor.name);

  constructor(private readonly circuitBreaker: CircuitBreakerService) {}

  @OnEvent('notification.event.created')
  async handleNotificationEvent(event: NotificationEvent) {
    if (!this.isScheduleEvent(event.eventType)) {
      return;
    }

    try {
      await this.circuitBreaker.execute(
        'schedule-processor',
        async () => {
          await this.processScheduleEvent(event);
        },
        { failureThreshold: 3, recoveryTimeout: 30000 },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process schedule event ${event.id}`,
        error.stack,
      );
      // Event will be retried via outbox pattern
    }
  }

  private isScheduleEvent(eventType: NotificationEventType): boolean {
    return eventType.startsWith('SCHEDULE_');
  }

  private async processScheduleEvent(event: NotificationEvent): Promise<void> {
    this.logger.log(`Processing schedule event: ${event.eventType}`);

    switch (event.eventType) {
      case NotificationEventType.SCHEDULE_EVENT_CREATED:
        await this.handleEventCreated(event);
        break;
      case NotificationEventType.SCHEDULE_EVENT_UPDATED:
        await this.handleEventUpdated(event);
        break;
      case NotificationEventType.SCHEDULE_EVENT_DELETED:
        await this.handleEventDeleted(event);
        break;
      case NotificationEventType.SCHEDULE_EVENT_ASSIGNED:
        await this.handleEventAssigned(event);
        break;
      case NotificationEventType.SCHEDULE_EVENT_UNASSIGNED:
        await this.handleEventUnassigned(event);
        break;
      default:
        this.logger.warn(`Unknown schedule event type: ${event.eventType}`);
    }
  }

  private async handleEventCreated(event: NotificationEvent): Promise<void> {
    const { payload } = event;
    this.logger.log(
      `Schedule event created: ${payload.title} on ${payload.date}`,
    );

    // Additional processing logic here (e.g., send emails, update calendars, etc.)
    // This would integrate with external services like email providers
  }

  private async handleEventUpdated(event: NotificationEvent): Promise<void> {
    const { payload } = event;
    this.logger.log(`Schedule event updated: ${payload.title}`);

    // Handle event updates, notify affected participants
  }

  private async handleEventDeleted(event: NotificationEvent): Promise<void> {
    const { payload } = event;
    this.logger.log(`Schedule event deleted: ${payload.title}`);

    // Handle event deletion, notify participants about cancellation
  }

  private async handleEventAssigned(event: NotificationEvent): Promise<void> {
    const { payload } = event;
    this.logger.log(
      `Staff ${payload.staffId} assigned to event ${payload.eventId}`,
    );

    // Send notification to assigned staff member
  }

  private async handleEventUnassigned(event: NotificationEvent): Promise<void> {
    const { payload } = event;
    this.logger.log(
      `Staff ${payload.staffId} unassigned from event ${payload.eventId}`,
    );

    // Send notification about unassignment
  }
}
