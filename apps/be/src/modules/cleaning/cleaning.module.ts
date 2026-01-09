import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import ScheduleCycleEntity from '../schedule/enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '../schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '../schedule/enties/schedule-event.entity';
import SwapRequestEntity from '../schedule/enties/swap-request.entity';
import StaffEntity from '../staff/staff.entity';
import { CleaningController } from './cleaning.controller';
import { CleaningService } from './cleaning.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleCycleEntity,
      ScheduleEventEntity,
      ScheduleEventParticipantEntity,
      StaffEntity,
      SwapRequestEntity,
    ]),
  ],
  controllers: [CleaningController],
  providers: [CleaningService],
  exports: [CleaningService],
})
export class CleaningModule {}
