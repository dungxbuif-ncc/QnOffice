import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CleaningCronService } from '@src/modules/schedule/services/cleaning-cron.service';
import { OpentalkCronService } from '@src/modules/schedule/services/opentalk-cron.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly cleaningCronService: CleaningCronService,
    private readonly opentalkCronService: OpentalkCronService,
  ) {}

  @Cron('0 0 * * *', {
    name: 'mark-past-events-completed',
    timeZone: 'Asia/Bangkok',
  })
  async markPastEventsCompleted(): Promise<void> {
    this.logger.log('=== CRON: Mark Past Events Completed (00:00 UTC+7) ===');
    try {
      await Promise.all([
        this.cleaningCronService.markPastEventsCompleted(),
        this.opentalkCronService.markPastEventsCompleted(),
      ]);
      this.logger.log('✅ Successfully marked past events as completed');
    } catch (error) {
      this.logger.error('❌ Error marking past events completed', error);
    }
  }
}
