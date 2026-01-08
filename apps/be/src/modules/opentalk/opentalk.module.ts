import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import ScheduleCycleEntity from '../schedule/enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '../schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '../schedule/enties/schedule-event.entity';
import StaffEntity from '../staff/staff.entity';
import OpentalkSlideSubmissionEntity from './entities/opentalk-slide-submission.entity';
import { OpentalkController } from './opentalk.controller';
import { OpentalkService } from './opentalk.service';
import { OpentalkSlideService } from './services/opentalk-slide.service';
import { OpentalkSlideSubscriber } from './subscribers/opentalk-slide.subscriber';
import SwapRequestEntity from './swap-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleCycleEntity,
      ScheduleEventEntity,
      ScheduleEventParticipantEntity,
      StaffEntity,
      SwapRequestEntity,
      OpentalkSlideSubmissionEntity,
    ]),
  ],
  controllers: [OpentalkController],
  providers: [OpentalkService, OpentalkSlideService, OpentalkSlideSubscriber],
  exports: [OpentalkService, OpentalkSlideService],
})
export class OpentalkModule {}
