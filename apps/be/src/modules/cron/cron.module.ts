import { Module } from '@nestjs/common';
import { AuditLogModule } from '@src/modules/audit-log/audit-log.module';
import { ScheduleModule } from '@src/modules/schedule/schedule.module';
import { CronService } from './cron.service';

@Module({
  imports: [ScheduleModule, AuditLogModule],
  providers: [CronService],
})
export class CronModule {}
