import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayController } from '@src/modules/holiday/holiday.constroller';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import { HolidayService } from '@src/modules/holiday/holiday.service';
import { HolidaySubscriber } from '@src/modules/holiday/subscribers/holiday.subscriber';
import { ScheduleModule } from '@src/modules/schedule/schedule.module';

@Module({
  imports: [TypeOrmModule.forFeature([HolidayEntity]), ScheduleModule],
  controllers: [HolidayController],
  providers: [HolidayService, HolidaySubscriber],
})
export class HolidayModule {}
