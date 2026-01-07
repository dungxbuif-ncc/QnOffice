import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { EventStatus } from '@qnoffice/shared';
import { getCurrentDateString } from '@src/common/utils/date.utils';
import { LessThan, Repository } from 'typeorm';
import ScheduleEventEntity from '../enties/schedule-event.entity';

@Injectable()
export class ScheduleEventCronService {
  private readonly logger = new Logger(ScheduleEventCronService.name);

  constructor(
    @InjectRepository(ScheduleEventEntity)
    private readonly scheduleEventRepository: Repository<ScheduleEventEntity>,
  ) {}

  /**
   * Runs every day at midnight (UTC+7 / Asia/Bangkok timezone)
   * Automatically completes all pending/active events before current date
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Bangkok',
  })
  async completeExpiredEvents() {
    const currentDate = getCurrentDateString();
    this.logger.log(
      `Running cron job to complete expired events. Current date: ${currentDate}`,
    );

    try {
      // Find all PENDING or ACTIVE events where eventDate is before today
      const expiredEvents = await this.scheduleEventRepository.find({
        where: [
          {
            eventDate: LessThan(currentDate),
            status: EventStatus.PENDING,
          },
          {
            eventDate: LessThan(currentDate),
            status: EventStatus.ACTIVE,
          },
        ],
      });

      if (expiredEvents.length === 0) {
        this.logger.log('No expired events to complete');
        return;
      }

      this.logger.log(
        `Found ${expiredEvents.length} expired event(s) to complete`,
      );

      // Update all expired events to COMPLETED status
      await this.scheduleEventRepository.update(
        {
          eventDate: LessThan(currentDate),
          status: EventStatus.PENDING,
        },
        {
          status: EventStatus.COMPLETED,
          notes: 'Auto-completed by system (expired)',
        },
      );

      await this.scheduleEventRepository.update(
        {
          eventDate: LessThan(currentDate),
          status: EventStatus.ACTIVE,
        },
        {
          status: EventStatus.COMPLETED,
          notes: 'Auto-completed by system (expired)',
        },
      );

      this.logger.log(
        `Successfully completed ${expiredEvents.length} expired event(s)`,
      );
    } catch (error) {
      this.logger.error('Error completing expired events', error.stack);
    }
  }

  /**
   * Manual trigger for completing expired events (useful for testing or manual runs)
   */
  async triggerCompleteExpiredEvents() {
    this.logger.log('Manually triggered complete expired events');
    await this.completeExpiredEvents();
  }
}
