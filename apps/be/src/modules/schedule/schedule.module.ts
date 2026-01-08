import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import HolidayEntity from '../holiday/holiday.entity';
import OpentalkSlideEntity from './enties/opentalk-slide.entity';
import ScheduleCycleEntity from './enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from './enties/schedule-event-participant.entity';
import ScheduleEventEntity from './enties/schedule-event.entity';
import { ScheduleEventQueueEntity } from './entities/schedule-event-queue.entity';
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
      ScheduleEventQueueEntity,
      OpentalkSlideEntity,
      HolidayEntity,
    ]),
    EventEmitterModule,
  ],
  controllers: [ScheduleController],
  providers: [
    ScheduleService,
    OpentalkStaffService,
    OpentalkCronService,
    CleaningCronService,
  ],
  exports: [
    ScheduleService,
    OpentalkStaffService,
    OpentalkCronService,
    CleaningCronService,
  ],
})
export class ScheduleModule {}
