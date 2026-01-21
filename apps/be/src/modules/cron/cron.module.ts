import { Module } from '@nestjs/common';
import { AuditLogModule } from '@src/modules/audit-log/audit-log.module';
import { OrderModule } from '@src/modules/order/order.module';
import { ScheduleModule } from '@src/modules/schedule/schedule.module';
import { CronService } from './cron.service';

@Module({
  imports: [ScheduleModule, AuditLogModule, OrderModule],
  providers: [CronService],
})
export class CronModule {}
