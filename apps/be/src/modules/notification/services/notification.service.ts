import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { NotificationOutboxEntity } from '../entities/notification-outbox.entity';
import { NotificationSubscriptionEntity } from '../entities/notification-subscription.entity';
import {
  NotificationEntity,
  NotificationStatus,
} from '../entities/notification.entity';

import {
  NotificationEventStatus,
  NotificationEventType,
  NotificationPriority,
} from '../enums/notification-event.enum';

import { CreateNotificationEventDto } from '../dtos/create-notification-event.dto';
import { CreateSubscriptionDto } from '../dtos/create-subscription.dto';

export interface NotificationEvent {
  id: string;
  eventType: NotificationEventType;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
  priority: NotificationPriority;
  userId?: number;
  staffId?: number;
  branchId?: number;
  aggregateId?: string;
  aggregateType?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationOutboxEntity)
    private readonly outboxRepository: Repository<NotificationOutboxEntity>,
    @InjectRepository(NotificationSubscriptionEntity)
    private readonly subscriptionRepository: Repository<NotificationSubscriptionEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Emit a notification event with reliable persistence using outbox pattern
   */
  async emitEvent(eventData: CreateNotificationEventDto): Promise<string> {
    const eventId = uuidv4();

    try {
      // Create outbox entry for reliable processing
      const outboxEntry = this.outboxRepository.create({
        eventId,
        eventType: eventData.eventType,
        payload: eventData.payload,
        metadata: eventData.metadata,
        priority: eventData.priority || NotificationPriority.MEDIUM,
        scheduledAt: eventData.scheduledAt || new Date(),
        aggregateId: eventData.metadata?.aggregateId,
        aggregateType: eventData.metadata?.aggregateType,
      });
      await this.outboxRepository.save(outboxEntry);

      this.logger.log(
        `Event ${eventData.eventType} with ID ${eventId} queued for processing`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue event ${eventData.eventType}`,
        error.stack,
      );
      throw error;
    }

    // Emit event for immediate processing (best effort)
    setImmediate(() => {
      this.eventEmitter.emit('notification.event.created', {
        id: eventId,
        ...eventData,
        priority: eventData.priority || NotificationPriority.MEDIUM,
      });
    });

    return eventId;
  }

  /**
   * Process events from outbox (called by scheduled job)
   */
  async processOutboxEvents(): Promise<void> {
    const pendingEvents = await this.outboxRepository.find({
      where: {
        status: NotificationEventStatus.PENDING,
        scheduledAt: LessThanOrEqual(new Date()),
      },
      order: { priority: 'DESC', createdAt: 'ASC' },
      take: 100, // Process in batches
    });

    for (const event of pendingEvents) {
      try {
        await this.processOutboxEvent(event);
      } catch (error) {
        this.logger.error(
          `Failed to process outbox event ${event.id}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Process a single outbox event
   */
  private async processOutboxEvent(
    outboxEvent: NotificationOutboxEntity,
  ): Promise<void> {
    try {
      // Mark as processing
      await this.outboxRepository.update(outboxEvent.id, {
        status: NotificationEventStatus.PROCESSING,
      });

      // Get subscriptions for this event type
      const subscriptions = await this.getMatchingSubscriptions(outboxEvent);

      // Create notifications for each subscription
      const notifications = await Promise.allSettled(
        subscriptions.map((subscription) =>
          this.createNotificationFromEvent(outboxEvent, subscription),
        ),
      );

      // Check if any notifications failed
      const failedNotifications = notifications.filter(
        (result) => result.status === 'rejected',
      );

      if (failedNotifications.length > 0) {
        throw new Error(
          `${failedNotifications.length} notifications failed to create`,
        );
      }

      // Mark as completed
      await this.outboxRepository.update(outboxEvent.id, {
        status: NotificationEventStatus.COMPLETED,
        processedAt: new Date(),
      });

      this.logger.log(`Processed outbox event ${outboxEvent.id} successfully`);
    } catch (error) {
      await this.handleOutboxEventFailure(outboxEvent, error);
    }
  }

  /**
   * Handle outbox event processing failure with retry logic
   */
  private async handleOutboxEventFailure(
    outboxEvent: NotificationOutboxEntity,
    error: Error,
  ): Promise<void> {
    const retryCount = outboxEvent.retryCount + 1;

    if (retryCount >= outboxEvent.maxRetries) {
      // Move to dead letter queue
      await this.outboxRepository.update(outboxEvent.id, {
        status: NotificationEventStatus.DEAD_LETTER,
        errorMessage: error.message,
        retryCount,
        failedAt: new Date(),
      });

      this.logger.error(
        `Outbox event ${outboxEvent.id} moved to dead letter queue after ${retryCount} retries`,
      );
    } else {
      // Schedule retry with exponential backoff
      const backoffMinutes = Math.pow(2, retryCount) * 5; // 5, 10, 20 minutes
      const nextScheduledAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await this.outboxRepository.update(outboxEvent.id, {
        status: NotificationEventStatus.FAILED,
        errorMessage: error.message,
        retryCount,
        scheduledAt: nextScheduledAt,
      });

      this.logger.warn(
        `Outbox event ${outboxEvent.id} failed, retry ${retryCount}/${outboxEvent.maxRetries} scheduled for ${nextScheduledAt}`,
      );
    }
  }

  /**
   * Get subscriptions that match the event
   */
  private async getMatchingSubscriptions(
    event: NotificationOutboxEntity,
  ): Promise<NotificationSubscriptionEntity[]> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { enabled: true },
    });

    return subscriptions.filter((subscription) => {
      // Check if event type matches (supports wildcards)
      if (!this.eventTypeMatches(event.eventType, subscription.eventType)) {
        return false;
      }

      // Apply filters if any
      if (subscription.filters) {
        return this.eventMatchesFilters(event, subscription.filters);
      }

      return true;
    });
  }

  /**
   * Check if event type matches subscription pattern
   */
  private eventTypeMatches(eventType: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;

    // Support wildcard patterns like "SCHEDULE_*"
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      return new RegExp(`^${regexPattern}$`).test(eventType);
    }

    return false;
  }

  /**
   * Check if event matches subscription filters
   */
  private eventMatchesFilters(
    event: NotificationOutboxEntity,
    filters: Record<string, any>,
  ): boolean {
    // Example filters: { branchId: 1, priority: 'HIGH' }
    for (const [key, value] of Object.entries(filters)) {
      if (event.payload[key] !== value && event.metadata?.[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Create notification from event and subscription
   */
  private async createNotificationFromEvent(
    event: NotificationOutboxEntity,
    subscription: NotificationSubscriptionEntity,
  ): Promise<void> {
    const message = this.generateNotificationMessage(event);
    const title = this.generateNotificationTitle(event);

    // Create notifications for each channel
    for (const channel of subscription.channels) {
      const notification = this.notificationRepository.create({
        userId: subscription.userId,
        staffId: subscription.staffId,
        eventId: event.eventId,
        title,
        message,
        channel,
        status: NotificationStatus.PENDING,
        data: {
          eventType: event.eventType,
          payload: event.payload,
          metadata: event.metadata,
        },
      });

      await this.notificationRepository.save(notification);
    }
  }

  /**
   * Generate notification message based on event
   */
  private generateNotificationMessage(event: NotificationOutboxEntity): string {
    const { eventType, payload } = event;

    switch (eventType) {
      case NotificationEventType.HOLIDAY_ADDED:
        return `New holiday added: ${payload.name} on ${payload.date}`;
      case NotificationEventType.SCHEDULE_EVENT_ASSIGNED:
        return `You have been assigned to ${payload.eventTitle} on ${payload.date}`;
      case NotificationEventType.OPENTALK_PARTICIPANTS_SWAPPED:
        return `OpenTalk participants have been swapped for ${payload.eventTitle}`;
      case NotificationEventType.CLEANING_ASSIGNED:
        return `You have been assigned cleaning duty on ${payload.date}`;
      default:
        return `Event ${eventType} occurred`;
    }
  }

  /**
   * Generate notification title based on event
   */
  private generateNotificationTitle(event: NotificationOutboxEntity): string {
    const { eventType } = event;

    if (eventType.includes('HOLIDAY')) return 'Holiday Update';
    if (eventType.includes('SCHEDULE')) return 'Schedule Update';
    if (eventType.includes('OPENTALK')) return 'OpenTalk Update';
    if (eventType.includes('CLEANING')) return 'Cleaning Schedule';
    if (eventType.includes('SWAP')) return 'Swap Request';

    return 'Notification';
  }

  /**
   * Create subscription
   */
  async createSubscription(
    data: CreateSubscriptionDto,
  ): Promise<NotificationSubscriptionEntity> {
    const subscription = this.subscriptionRepository.create(data);
    return await this.subscriptionRepository.save(subscription);
  }

  /**
   * Get user notifications
   */
  async getNotifications(
    userId?: number,
    staffId?: number,
    options?: { read?: boolean; page?: number; limit?: number },
  ): Promise<NotificationEntity[]> {
    const query =
      this.notificationRepository.createQueryBuilder('notification');

    if (userId) {
      query.andWhere('notification.userId = :userId', { userId });
    }

    if (staffId) {
      query.andWhere('notification.staffId = :staffId', { staffId });
    }

    if (options?.read !== undefined) {
      query.andWhere('notification.read = :read', { read: options.read });
    }

    query.orderBy('notification.createdAt', 'DESC');

    if (options?.page && options?.limit) {
      query.skip((options.page - 1) * options.limit).take(options.limit);
    }

    return await query.getMany();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    await this.notificationRepository.update(notificationId, {
      read: true,
      readAt: new Date(),
    });
  }

  /**
   * Get failed events for monitoring
   */
  async getFailedEvents(): Promise<NotificationOutboxEntity[]> {
    return await this.outboxRepository.find({
      where: [
        { status: NotificationEventStatus.FAILED },
        { status: NotificationEventStatus.DEAD_LETTER },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retry failed event
   */
  async retryFailedEvent(outboxId: number): Promise<void> {
    const event = await this.outboxRepository.findOne({
      where: { id: outboxId },
    });
    if (!event) {
      throw new Error('Outbox event not found');
    }

    await this.outboxRepository.update(outboxId, {
      status: NotificationEventStatus.PENDING,
      scheduledAt: new Date(),
      errorMessage: undefined,
    });

    this.logger.log(`Outbox event ${outboxId} queued for retry`);
  }
}
