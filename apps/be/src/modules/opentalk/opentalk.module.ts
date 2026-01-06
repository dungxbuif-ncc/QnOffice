import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import ScheduleCycleEntity from '../schedule/enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '../schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '../schedule/enties/schedule-event.entity';
import StaffEntity from '../staff/staff.entity';
import { OpentalkController } from './opentalk.controller';
import { OpentalkService } from './opentalk.service';
import SwapRequestEntity from './swap-request.entity';

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
  controllers: [OpentalkController],
  providers: [OpentalkService],
  exports: [OpentalkService],
})
export class OpentalkModule {}
