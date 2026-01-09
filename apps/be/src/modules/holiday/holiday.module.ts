import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayController } from '@src/modules/holiday/holiday.controller';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import { HolidayService } from '@src/modules/holiday/holiday.service';
import { ScheduleModule } from '@src/modules/schedule/schedule.module';

@Module({
  imports: [TypeOrmModule.forFeature([HolidayEntity]), ScheduleModule],
  controllers: [HolidayController],
  providers: [HolidayService],
})
export class HolidayModule {}
