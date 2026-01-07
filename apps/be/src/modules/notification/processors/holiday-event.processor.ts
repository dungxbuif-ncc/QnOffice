import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationEventType } from '../enums/notification-event.enum';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { NotificationEvent } from '../services/notification.service';

@Injectable()
export class HolidayEventProcessor {
  private readonly logger = new Logger(HolidayEventProcessor.name);

  constructor(private readonly circuitBreaker: CircuitBreakerService) {}

  @OnEvent('notification.event.created')
  async handleNotificationEvent(event: NotificationEvent) {
    if (!this.isHolidayEvent(event.eventType)) {
      return;
    }

    try {
      await this.circuitBreaker.execute(
        'holiday-processor',
        async () => {
          await this.processHolidayEvent(event);
        },
        { failureThreshold: 3, recoveryTimeout: 30000 },
      );
    } catch (error) {
      this.logger.error(
        `Failed to process holiday event ${event.id}`,
        error.stack,
      );
    }
  }

  private isHolidayEvent(eventType: NotificationEventType): boolean {
    return eventType.startsWith('HOLIDAY_');
  }

  private async processHolidayEvent(event: NotificationEvent): Promise<void> {
    this.logger.log(`Processing holiday event: ${event.eventType}`);

    switch (event.eventType) {
      case NotificationEventType.HOLIDAY_ADDED:
        await this.handleHolidayAdded(event);
        break;
      case NotificationEventType.HOLIDAY_REMOVED:
        await this.handleHolidayRemoved(event);
        break;
      case NotificationEventType.HOLIDAY_UPDATED:
        await this.handleHolidayUpdated(event);
        break;
      default:
        this.logger.warn(`Unknown holiday event type: ${event.eventType}`);
    }
  }

  private async handleHolidayAdded(event: NotificationEvent): Promise<void> {
    const { payload } = event;
    this.logger.log(`Holiday added: ${payload.name} on ${payload.date}`);

    // This is a critical event that affects schedule planning
    // Need to check for conflicts with existing schedules and notify relevant staff
    await this.checkScheduleConflicts(payload);
  }

  private async handleHolidayRemoved(event: NotificationEvent): Promise<void> {
    const { payload } = event;
    this.logger.log(`Holiday removed: ${payload.name} on ${payload.date}`);

    // Holiday removal might open up scheduling opportunities
    await this.notifySchedulingOpportunity(payload);
  }

  private async handleHolidayUpdated(event: NotificationEvent): Promise<void> {
    const { payload } = event;
    this.logger.log(`Holiday updated: ${payload.name}`);

    // Handle holiday updates (date changes, etc.)
    await this.handleDateChange(payload);
  }

  private async checkScheduleConflicts(payload: any): Promise<void> {
    // This would integrate with the schedule service to check for conflicts
    // and create notifications for affected events
    this.logger.log(`Checking schedule conflicts for holiday: ${payload.name}`);
  }

  private async notifySchedulingOpportunity(payload: any): Promise<void> {
    // Notify relevant staff about the opportunity to schedule on the removed holiday
    this.logger.log(`Notifying about scheduling opportunity: ${payload.name}`);
  }

  private async handleDateChange(payload: any): Promise<void> {
    // Handle when a holiday date changes
    this.logger.log(`Handling holiday date change: ${payload.name}`);
  }
}
