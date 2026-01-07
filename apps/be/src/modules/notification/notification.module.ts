import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { NotificationEventEntity } from './entities/notification-event.entity';
import { NotificationOutboxEntity } from './entities/notification-outbox.entity';
import { NotificationSubscriptionEntity } from './entities/notification-subscription.entity';
import { NotificationEntity } from './entities/notification.entity';
import { HolidayEventProcessor } from './processors/holiday-event.processor';
import { OpentalkEventProcessor } from './processors/opentalk-event.processor';
import { ScheduleEventProcessor } from './processors/schedule-event.processor';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { NotificationSchedulerService } from './services/notification-scheduler.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEventEntity,
      NotificationOutboxEntity,
      NotificationSubscriptionEntity,
      NotificationEntity,
    ]),
    ScheduleModule.forRoot(),
  ],
  providers: [
    NotificationService,
    CircuitBreakerService,
    NotificationSchedulerService,
    ScheduleEventProcessor,
    HolidayEventProcessor,
    OpentalkEventProcessor,
  ],
  exports: [NotificationService, CircuitBreakerService],
})
export class NotificationModule {}
