import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayController } from '@src/modules/holiday/holiday.constroller';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import { HolidayService } from '@src/modules/holiday/holiday.service';
import { NotificationModule } from '@src/modules/notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([HolidayEntity]), NotificationModule],
  controllers: [HolidayController],
  providers: [HolidayService],
})
export class HolidayModule {}
