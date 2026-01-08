import { Module } from '@nestjs/common';
import { ScheduleModule } from '@src/modules/schedule/schedule.module';
import { CronService } from './cron.service';

@Module({
  imports: [ScheduleModule],
  providers: [CronService],
})
export class CronModule {}
