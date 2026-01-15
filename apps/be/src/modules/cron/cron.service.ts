import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { APP_TIMEZONE } from '@src/common/constants';
import { AppLogService } from '@src/common/shared/services/app-log.service';
import { nowVn } from '@src/common/utils/time.util';
import { AuditLogService } from '@src/modules/audit-log/audit-log.service';
import { CleaningCronService } from '@src/modules/schedule/services/cleaning-cron.service';
import { OpentalkCronService } from '@src/modules/schedule/services/opentalk-cron.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CronService {
  constructor(
    private readonly cleaningCronService: CleaningCronService,
    private readonly opentalkCronService: OpentalkCronService,
    private readonly auditLogService: AuditLogService,
    private readonly appLogService: AppLogService,
    // private readonly mezonClient: MezonClient,
  ) {
    // this.mezonClient.on('ready', () => {
    //   this.sendCleaningMorningReminder();
    // });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'mark-events-completed',
    timeZone: APP_TIMEZONE,
  })
  async markEventsCompleted(): Promise<void> {
    const journeyId = `mark-events-completed-${uuidv4()}`;
    const executionTime = nowVn();
    const dayOfWeek = executionTime.getDay();
    const cleaningJourneyId = `daily-cleaning-cycle-check-${uuidv4()}`;
    this.appLogService.journeyLog(
      cleaningJourneyId,
      'Starting daily cleaning cycle check',
      'CronService',
      {
        cronJob: 'daily-cleaning-cycle-check',
        executionTime: executionTime.toISOString(),
      },
    );
    const opentalkJourneyId = `daily-opentalk-cycle-check-${uuidv4()}`;
    this.appLogService.journeyLog(
      opentalkJourneyId,
      'Starting daily opentalk cycle check',
      'CronService',
      {
        cronJob: 'daily-opentalk-cycle-check',
        executionTime: executionTime.toISOString(),
      },
    );
    if (dayOfWeek >= 2 && dayOfWeek <= 6) {
      this.appLogService.journeyLog(
        journeyId,
        'Starting cleaning events completion cron job (Tuesday-Saturday)',
        'CronService',
        {
          cronJob: 'mark-cleaning-events-completed',
          dayOfWeek,
          executionTime: executionTime.toISOString(),
        },
      );

      await this.cleaningCronService.markPastEventsCompleted(journeyId);
    } else if (dayOfWeek === 0) {
      this.appLogService.journeyLog(
        journeyId,
        'Starting opentalk events completion cron job (Sunday)',
        'CronService',
        {
          cronJob: 'mark-opentalk-events-completed',
          dayOfWeek,
          executionTime: executionTime.toISOString(),
        },
      );

      await this.opentalkCronService.markPastEventsCompleted(journeyId);
    }
    await this.cleaningCronService.handleAutomaticCycleCreation(journeyId);
    await this.opentalkCronService.handleAutomaticCycleCreation(journeyId);
  }

  @Cron('0 2 1 * *', {
    name: 'cleanup-old-audit-logs',
    timeZone: APP_TIMEZONE,
  })
  async cleanupOldAuditLogs(): Promise<void> {
    const journeyId = `cleanup-old-audit-logs-${uuidv4()}`;

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

      this.appLogService.journeyLog(
        journeyId,
        `✅ Successfully deleted ${deletedCount} old audit log entries`,
        'CronService',
        { deletedCount },
      );
    } catch (error) {
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
    timeZone: APP_TIMEZONE,
  })
  async sendCleaningMorningReminder(): Promise<void> {
    const journeyId = `cleaning-morning-reminder-${uuidv4()}`;
    const executionTime = nowVn();

    this.appLogService.journeyLog(
      journeyId,
      'Starting cleaning morning reminder cron job (Monday-Friday)',
      'CronService',
      {
        cronJob: 'cleaning-morning-reminder',
        dayOfWeek: executionTime.getDay(),
        executionTime: executionTime.toISOString(),
      },
    );

    await this.cleaningCronService.sendMorningReminder(journeyId);
  }

  @Cron('0 9 * * *', {
    name: 'opentalk-slide-check',
    timeZone: APP_TIMEZONE,
  })
  async checkOpentalkSlideSubmission(): Promise<void> {
    const journeyId = `opentalk-slide-check-${uuidv4()}`;
    const executionTime = nowVn();
    this.appLogService.journeyLog(
      journeyId,
      'Starting opentalk slide submission check cron job (Daily)',
      'CronService',
      {
        cronJob: 'opentalk-slide-check',
        dayOfWeek: executionTime.getDay(),
        executionTime: executionTime.toISOString(),
      },
    );
    await this.opentalkCronService.checkSlideSubmission(journeyId);
  }

  @Cron('0 17 * * 1-5', {
    name: 'cleaning-afternoon-reminder',
    timeZone: APP_TIMEZONE,
  })
  async sendCleaningAfternoonReminder(): Promise<void> {
    const afternoonJourneyId = `cleaning-afternoon-reminder-${uuidv4()}`;
    const executionTime = nowVn();

    this.appLogService.journeyLog(
      afternoonJourneyId,
      'Starting cleaning afternoon reminder cron job (Monday-Friday)',
      'CronService',
      {
        cronJob: 'cleaning-afternoon-reminder',
        dayOfWeek: executionTime.getDay(),
        executionTime: executionTime.toISOString(),
      },
    );

    const nextDayJourneyId = `cleaning-next-day-reminder-${uuidv4()}`;

    this.appLogService.journeyLog(
      nextDayJourneyId,
      'Starting cleaning next day reminder cron job',
      'CronService',
      {
        cronJob: 'cleaning-next-day-reminder',
        dayOfWeek: executionTime.getDay(),
        executionTime: executionTime.toISOString(),
      },
    );

    await this.cleaningCronService.sendAfternoonReminder(afternoonJourneyId);
    await this.cleaningCronService.sendNextDayReminder(nextDayJourneyId);
  }
}
