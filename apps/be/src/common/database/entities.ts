import AuditLogEntity from '@src/modules/audit-log/audit-log.entity';
import { BranchEntity } from '@src/modules/branch/branch.entity';
import { Campaign } from '@src/modules/campaign/campaign.entity';
import ChannelConfigEntity from '@src/modules/channel/channel-config.entity';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import SwapRequestEntity from '@src/modules/opentalk/swap-request.entity';
import { PenaltyType } from '@src/modules/penalty-type/penalty-type.entity';
import { Penalty } from '@src/modules/penalty/penalty.entity';
import ScheduleCycleEntity from '@src/modules/schedule/enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '@src/modules/schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';
import { ScheduleEventQueueEntity } from '@src/modules/schedule/entities/schedule-event-queue.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import UserEntity from '@src/modules/user/user.entity';

const entities = [
  UserEntity,
  BranchEntity,
  StaffEntity,
  ChannelConfigEntity,
  HolidayEntity,
  SwapRequestEntity,
  Penalty,
  PenaltyType,
  Campaign,
  ScheduleCycleEntity,
  ScheduleEventEntity,
  ScheduleEventParticipantEntity,
  ScheduleEventQueueEntity,
  AuditLogEntity,
];
export default entities;
