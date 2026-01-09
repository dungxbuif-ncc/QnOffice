import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CleaningCronService } from '@src/modules/schedule/services/cleaning-cron.service';
import { OpentalkCronService } from '@src/modules/schedule/services/opentalk-cron.service';

@Injectable()
export class BotCronService {
  private readonly logger = new Logger(BotCronService.name);

  constructor(
    private readonly cleaningCronService: CleaningCronService,
    private readonly opentalkCronService: OpentalkCronService,
  ) {}

  @Cron('0 8 * * *', {
    name: 'cleaning-morning-reminder',
    timeZone: 'Asia/Bangkok',
  })
  async sendCleaningMorningReminder(): Promise<void> {
    this.logger.log('=== CRON: Cleaning Morning Reminder (08:00 UTC+7) ===');
    try {
      await this.cleaningCronService.sendMorningReminder();
      this.logger.log('✅ Cleaning morning reminders sent');
    } catch (error) {
      this.logger.error('❌ Error sending cleaning morning reminders', error);
    }
  }

  @Cron('0 9 * * *', {
    name: 'opentalk-slide-check',
    timeZone: 'Asia/Bangkok',
  })
  async checkOpentalkSlideSubmission(): Promise<void> {
    this.logger.log(
      '=== CRON: Opentalk Slide Submission Check (09:00 UTC+7) ===',
    );
    try {
      await this.opentalkCronService.checkSlideSubmission();
      this.logger.log('✅ Opentalk slide check completed');
    } catch (error) {
      this.logger.error('❌ Error checking opentalk slides', error);
    }
  }

  @Cron('0 17 * * *', {
    name: 'cleaning-afternoon-reminder',
    timeZone: 'Asia/Bangkok',
  })
  async sendCleaningAfternoonReminder(): Promise<void> {
    this.logger.log('=== CRON: Cleaning Afternoon Reminder (17:00 UTC+7) ===');
    try {
      await this.cleaningCronService.sendAfternoonReminder();
      this.logger.log('✅ Cleaning afternoon reminders sent');
    } catch (error) {
      this.logger.error('❌ Error sending cleaning afternoon reminders', error);
    }
  }
}
