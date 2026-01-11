import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import { AuditLogService } from '@src/modules/audit-log/audit-log.service';
import { CleaningCronService } from '@src/modules/schedule/services/cleaning-cron.service';
import { OpentalkCronService } from '@src/modules/schedule/services/opentalk-cron.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly cleaningCronService: CleaningCronService,
    private readonly opentalkCronService: OpentalkCronService,
    private readonly auditLogService: AuditLogService,
    private readonly appLogService: AppLogService,
  ) {}

  @Cron('0 0 * * 2-6', {
    name: 'mark-cleaning-events-completed',
    timeZone: 'Asia/Bangkok',
  })
  async markCleaningEventsCompleted(): Promise<void> {
    const journeyId = `mark-cleaning-events-completed-${uuidv4()}`;
    const executionTime = new Date();

    this.logger.log(
      '=== CRON: Mark Cleaning Events Completed (00:00 Tue-Sat UTC+7) ===',
    );

    this.appLogService.journeyLog(
      journeyId,
      'Starting cleaning events completion cron job (Tuesday-Saturday)',
      'CronService',
      {
        cronJob: 'mark-cleaning-events-completed',
        dayOfWeek: executionTime.getDay(),
        dayName: executionTime.toLocaleDateString('en-US', { weekday: 'long' }),
        executionTime: executionTime.toISOString(),
        timezone: 'Asia/Bangkok',
        localTime: executionTime.toLocaleString('en-US', {
          timeZone: 'Asia/Bangkok',
        }),
      },
    );

    try {
      this.appLogService.stepLog(
        1,
        'Executing cleaning events cleanup',
        'CronService',
        journeyId,
      );

      await this.cleaningCronService.markPastEventsCompleted(journeyId);

      this.logger.log(
        '✅ Successfully marked past cleaning events as completed',
      );
      this.appLogService.journeyLog(
        journeyId,
        '✅ Successfully marked past cleaning events as completed',
        'CronService',
      );
    } catch (error) {
      this.logger.error(
        '❌ Error marking past cleaning events completed',
        error,
      );
      this.appLogService.journeyError(
        journeyId,
        '❌ Error marking past cleaning events completed',
        error.stack,
        'CronService',
        { error: error.message },
      );
    }
  }

  @Cron('0 0 * * 0', {
    name: 'mark-opentalk-events-completed',
    timeZone: 'Asia/Bangkok',
  })
  async markOpentalkEventsCompleted(): Promise<void> {
    const journeyId = `mark-opentalk-events-completed-${uuidv4()}`;
    const executionTime = new Date();


    this.appLogService.journeyLog(
      journeyId,
      'Starting opentalk events completion cron job (Sunday)',
      'CronService',
      {
        cronJob: 'mark-opentalk-events-completed',
        dayOfWeek: executionTime.getDay(),
        dayName: executionTime.toLocaleDateString('en-US', { weekday: 'long' }),
        executionTime: executionTime.toISOString(),
        timezone: 'Asia/Bangkok',
        localTime: executionTime.toLocaleString('en-US', {
          timeZone: 'Asia/Bangkok',
        }),
      },
    );

    try {
      this.appLogService.stepLog(
        1,
        'Executing opentalk events cleanup and activation',
        'CronService',
        journeyId,
      );

      await this.opentalkCronService.markPastEventsCompleted(journeyId);

      this.logger.log(
        '✅ Successfully marked past opentalk events as completed',
      );
      this.appLogService.journeyLog(
        journeyId,
        '✅ Successfully marked past opentalk events as completed',
        'CronService',
      );
    } catch (error) {
      this.logger.error(
        '❌ Error marking past opentalk events completed',
        error,
      );
      this.appLogService.journeyError(
        journeyId,
        '❌ Error marking past opentalk events completed',
        error.stack,
        'CronService',
        { error: error.message },
      );
    }
  }

  @Cron('0 2 1 * *', {
    name: 'cleanup-old-audit-logs',
    timeZone: 'Asia/Bangkok',
  })
  async cleanupOldAuditLogs(): Promise<void> {
    const journeyId = `cleanup-old-audit-logs-${uuidv4()}`;
    this.logger.log(
      '=== CRON: Cleanup Old Audit Logs (02:00 1st of month UTC+7) ===',
    );

    this.appLogService.journeyLog(
      journeyId,
      'Starting monthly audit log cleanup cron job',
      'CronService',
      { cronJob: 'cleanup-old-audit-logs' },
    );

    try {
      this.appLogService.stepLog(
        1,
        'Deleting audit logs older than 30 days',
        'CronService',
        journeyId,
      );

      const deletedCount = await this.auditLogService.deleteOldLogs(30);

      this.logger.log(
        `✅ Successfully deleted ${deletedCount} old audit log entries`,
      );
      this.appLogService.journeyLog(
        journeyId,
        `✅ Successfully deleted ${deletedCount} old audit log entries`,
        'CronService',
        { deletedCount },
      );
    } catch (error) {
      this.logger.error('❌ Error cleaning up old audit logs', error);
      this.appLogService.journeyError(
        journeyId,
        '❌ Error cleaning up old audit logs',
        error.stack,
        'CronService',
        { error: error.message },
      );
    }
  }

  @Cron('0 8 * * 1-5', {
    name: 'cleaning-morning-reminder',
    timeZone: 'Asia/Bangkok',
  })
  async sendCleaningMorningReminder(): Promise<void> {
    const journeyId = `cleaning-morning-reminder-${uuidv4()}`;
    const executionTime = new Date();

    this.logger.log('=== CRON: Cleaning Morning Reminder (08:00 UTC+7) ===');

    this.appLogService.journeyLog(
      journeyId,
      'Starting cleaning morning reminder cron job (Monday-Friday)',
      'CronService',
      {
        cronJob: 'cleaning-morning-reminder',
        dayOfWeek: executionTime.getDay(),
        dayName: executionTime.toLocaleDateString('en-US', { weekday: 'long' }),
        executionTime: executionTime.toISOString(),
        timezone: 'Asia/Bangkok',
        localTime: executionTime.toLocaleString('en-US', {
          timeZone: 'Asia/Bangkok',
        }),
      },
    );

    try {
      this.appLogService.stepLog(
        1,
        'Executing cleaning morning reminder',
        'CronService',
        journeyId,
      );

      await this.cleaningCronService.sendMorningReminder(journeyId);

      this.logger.log('✅ Cleaning morning reminders sent');
      this.appLogService.journeyLog(
        journeyId,
        '✅ Successfully sent cleaning morning reminders',
        'CronService',
      );
    } catch (error) {
      this.logger.error('❌ Error sending cleaning morning reminders', error);
      this.appLogService.journeyError(
        journeyId,
        '❌ Error sending cleaning morning reminders',
        error.stack,
        'CronService',
        { error: error.message },
      );
    }
  }

  @Cron('0 9 * * *', {
    name: 'opentalk-slide-check',
    timeZone: 'Asia/Bangkok',
  })
  async checkOpentalkSlideSubmission(): Promise<void> {
    const journeyId = `opentalk-slide-check-${uuidv4()}`;
    const executionTime = new Date();

    this.logger.log(
      '=== CRON: Opentalk Slide Submission Check (09:00 UTC+7) ===',
    );

    this.appLogService.journeyLog(
      journeyId,
      'Starting opentalk slide submission check cron job (Daily)',
      'CronService',
      {
        cronJob: 'opentalk-slide-check',
        dayOfWeek: executionTime.getDay(),
        dayName: executionTime.toLocaleDateString('en-US', { weekday: 'long' }),
        executionTime: executionTime.toISOString(),
        timezone: 'Asia/Bangkok',
        localTime: executionTime.toLocaleString('en-US', {
          timeZone: 'Asia/Bangkok',
        }),
      },
    );

    try {
      this.appLogService.stepLog(
        1,
        'Executing opentalk slide submission check',
        'CronService',
        journeyId,
      );

      await this.opentalkCronService.checkSlideSubmission(journeyId);

      this.logger.log('✅ Opentalk slide check completed');
      this.appLogService.journeyLog(
        journeyId,
        '✅ Successfully completed opentalk slide check',
        'CronService',
      );
    } catch (error) {
      this.logger.error('❌ Error checking opentalk slides', error);
      this.appLogService.journeyError(
        journeyId,
        '❌ Error checking opentalk slides',
        error.stack,
        'CronService',
        { error: error.message },
      );
    }
  }

  @Cron('0 17 * * 1-5', {
    name: 'cleaning-afternoon-reminder',
    timeZone: 'Asia/Bangkok',
  })
  async sendCleaningAfternoonReminder(): Promise<void> {
    const journeyId = `cleaning-afternoon-reminder-${uuidv4()}`;
    const executionTime = new Date();

    this.logger.log('=== CRON: Cleaning Afternoon Reminder (17:00 UTC+7) ===');

    this.appLogService.journeyLog(
      journeyId,
      'Starting cleaning afternoon reminder cron job (Monday-Friday)',
      'CronService',
      {
        cronJob: 'cleaning-afternoon-reminder',
        dayOfWeek: executionTime.getDay(),
        dayName: executionTime.toLocaleDateString('en-US', { weekday: 'long' }),
        executionTime: executionTime.toISOString(),
        timezone: 'Asia/Bangkok',
        localTime: executionTime.toLocaleString('en-US', {
          timeZone: 'Asia/Bangkok',
        }),
      },
    );

    try {
      this.appLogService.stepLog(
        1,
        'Executing cleaning afternoon reminder',
        'CronService',
        journeyId,
      );

      await this.cleaningCronService.sendAfternoonReminder(journeyId);

      this.logger.log('✅ Cleaning afternoon reminders sent');
      this.appLogService.journeyLog(
        journeyId,
        '✅ Successfully sent cleaning afternoon reminders',
        'CronService',
      );
    } catch (error) {
      this.logger.error('❌ Error sending cleaning afternoon reminders', error);
      this.appLogService.journeyError(
        journeyId,
        '❌ Error sending cleaning afternoon reminders',
        error.stack,
        'CronService',
        { error: error.message },
      );
    }
  }

  @Cron('0 6 * * *', {
    name: 'daily-schedule-cycle-check',
    timeZone: 'Asia/Bangkok',
  })
  async handleDailyCycleCheck(): Promise<void> {
    const journeyId = `daily-cycle-check-${uuidv4()}`;
    const executionTime = new Date();

    this.logger.log('=== CRON: Daily Schedule Cycle Check (06:00 UTC+7) ===');

    this.appLogService.journeyLog(
      journeyId,
      'Starting daily schedule cycle check cron job',
      'CronService',
      {
        cronJob: 'daily-schedule-cycle-check',
        executionTime: executionTime.toISOString(),
        timezone: 'Asia/Bangkok',
      },
    );

    try {
      this.appLogService.stepLog(
        1,
        'Checking cleaning cycle',
        'CronService',
        journeyId,
      );
      await this.cleaningCronService.handleAutomaticCycleCreation(journeyId);

      this.appLogService.stepLog(
        2,
        'Checking opentalk cycle',
        'CronService',
        journeyId,
      );
      await this.opentalkCronService.handleAutomaticCycleCreation(journeyId);

      this.logger.log('✅ Daily schedule cycle check completed');
      this.appLogService.journeyLog(
        journeyId,
        '✅ Successfully completed daily schedule cycle check',
        'CronService',
      );
    } catch (error) {
      this.logger.error('❌ Error in daily schedule cycle check', error);
      this.appLogService.journeyError(
        journeyId,
        '❌ Error in daily schedule cycle check',
        error.stack,
        'CronService',
        { error: error.message },
      );
    }
  }
}
