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

  @Cron('0 0 * * *', {
    name: 'mark-past-events-completed',
    timeZone: 'Asia/Bangkok',
  })
  async markPastEventsCompleted(): Promise<void> {
    const journeyId = uuidv4();
    this.logger.log('=== CRON: Mark Past Events Completed (00:00 UTC+7) ===');

    this.appLogService.journeyLog(
      journeyId,
      'Starting mark past events completed cron job',
      'CronService',
      { cronJob: 'mark-past-events-completed' },
    );

    try {
      this.appLogService.stepLog(
        1,
        'Executing parallel cleanup for cleaning and opentalk events',
        'CronService',
        journeyId,
      );

      await Promise.all([
        this.cleaningCronService.markPastEventsCompleted(),
        this.opentalkCronService.markPastEventsCompleted(),
      ]);

      this.logger.log('✅ Successfully marked past events as completed');
      this.appLogService.journeyLog(
        journeyId,
        '✅ Successfully marked past events as completed',
        'CronService',
      );
    } catch (error) {
      this.logger.error('❌ Error marking past events completed', error);
      this.appLogService.journeyError(
        journeyId,
        '❌ Error marking past events completed',
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
    const journeyId = uuidv4();
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
}
