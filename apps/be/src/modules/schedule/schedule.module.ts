import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleaningService } from '@src/modules/cleaning/cleaning.service';
import { OpentalkService } from '@src/modules/opentalk/opentalk.service';
import SwapRequestEntity from '@src/modules/swap-request/swap-request.entity';
import HolidayEntity from '../holiday/holiday.entity';
import OpentalkSlideEntity from '../opentalk/entities/opentalk-slide.entity';
import StaffEntity from '../staff/staff.entity';
import ScheduleCycleEntity from './enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from './enties/schedule-event-participant.entity';
import ScheduleEventEntity from './enties/schedule-event.entity';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { CleaningCronService } from './services/cleaning-cron.service';
import { OpentalkCronService } from './services/opentalk-cron.service';
import { OpentalkStaffService } from './services/opentalk-staff.schedule.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleCycleEntity,
      ScheduleEventEntity,
      ScheduleEventParticipantEntity,
      HolidayEntity,
      OpentalkSlideEntity,
      StaffEntity,
      SwapRequestEntity
    ]),
    EventEmitterModule,
  ],
  controllers: [ScheduleController],
  providers: [
    ScheduleService,
    OpentalkStaffService,
    OpentalkCronService,
    CleaningCronService,
    OpentalkService,
    CleaningService
  ],
  exports: [
    ScheduleService,
    OpentalkStaffService,
    OpentalkCronService,
    CleaningCronService,
  ],
})
export class ScheduleModule {}
