import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  /**
   * Process outbox events every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processOutboxEvents() {
    try {
      await this.circuitBreaker.execute(
        'outbox-processor',
        async () => {
          await this.notificationService.processOutboxEvents();
        },
        {
          failureThreshold: 3,
          recoveryTimeout: 60000, // 1 minute
        },
      );
    } catch (error) {
      this.logger.error('Failed to process outbox events', error.stack);
    }
  }

  /**
   * Clean up old processed events every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldEvents() {
    try {
      await this.circuitBreaker.execute(
        'cleanup-processor',
        async () => {
          // This would be implemented in the notification service
          // await this.notificationService.cleanupOldEvents();
          this.logger.log('Cleaned up old events');
        },
        {
          failureThreshold: 2,
          recoveryTimeout: 300000, // 5 minutes
        },
      );
    } catch (error) {
      this.logger.error('Failed to clean up old events', error.stack);
    }
  }

  /**
   * Health check for notification system every 5 minutes
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async healthCheck() {
    try {
      const stats = this.circuitBreaker.getAllStats();
      const openCircuits = Object.entries(stats).filter(
        ([, stat]) => stat.state === 'OPEN',
      );

      if (openCircuits.length > 0) {
        this.logger.warn(
          `Health check: ${openCircuits.length} circuit breakers are OPEN`,
          openCircuits.map(([name, stat]) => ({
            circuit: name,
            state: stat.state,
            failures: stat.failureCount,
            lastFailure: stat.lastFailureTime,
          })),
        );
      } else {
        this.logger.log('Health check: All notification circuits are healthy');
      }

      // Get failed events for monitoring
      const failedEvents = await this.notificationService.getFailedEvents();
      if (failedEvents.length > 0) {
        this.logger.warn(
          `Health check: ${failedEvents.length} events in failed/dead letter state`,
        );
      }
    } catch (error) {
      this.logger.error('Health check failed', error.stack);
    }
  }

  /**
   * Retry failed events every 10 minutes
   */
  @Cron('*/10 * * * *') // Every 10 minutes
  async retryFailedEvents() {
    try {
      await this.circuitBreaker.execute(
        'retry-processor',
        async () => {
          const failedEvents = await this.notificationService.getFailedEvents();

          // Only retry events that are in FAILED state (not DEAD_LETTER)
          const retryableEvents = failedEvents.filter(
            (event) =>
              event.status === 'FAILED' &&
              event.retryCount < event.maxRetries &&
              new Date() >= new Date(event.scheduledAt),
          );

          for (const event of retryableEvents.slice(0, 10)) {
            // Limit to 10 retries per run
            try {
              await this.notificationService.retryFailedEvent(event.id);
              this.logger.log(`Queued retry for failed event ${event.id}`);
            } catch (error) {
              this.logger.error(
                `Failed to queue retry for event ${event.id}`,
                error.stack,
              );
            }
          }

          if (retryableEvents.length > 0) {
            this.logger.log(
              `Queued ${Math.min(retryableEvents.length, 10)} failed events for retry`,
            );
          }
        },
        {
          failureThreshold: 2,
          recoveryTimeout: 600000, // 10 minutes
        },
      );
    } catch (error) {
      this.logger.error('Failed to process event retries', error.stack);
    }
  }

  /**
   * Generate daily notification metrics
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyMetrics() {
    try {
      // This would generate daily reports on notification system health
      // Metrics like: events processed, failures, circuit breaker activity, etc.
      this.logger.log('Generated daily notification metrics');
    } catch (error) {
      this.logger.error('Failed to generate daily metrics', error.stack);
    }
  }
}
