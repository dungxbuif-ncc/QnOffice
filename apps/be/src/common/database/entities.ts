import AuditLogEntity from '@src/modules/audit-log/audit-log.entity';
import { BranchEntity } from '@src/modules/branch/branch.entity';
import ChannelConfigEntity from '@src/modules/channel/channel-config.entity';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import OpentalkSlideEntity from '@src/modules/opentalk/entities/opentalk-slide.entity';
import { PantryMenuItemEntity } from '@src/modules/pantry-menu/entities/pantry-menu-item.entity';
import { PenaltyType } from '@src/modules/penalty-type/penalty-type.entity';
import { PenaltyProofEntity } from '@src/modules/penalty/entities/penalty-proof.entity';
import { Penalty } from '@src/modules/penalty/penalty.entity';
import ScheduleCycleEntity from '@src/modules/schedule/enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '@src/modules/schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import SwapRequestEntity from '@src/modules/swap-request/swap-request.entity';
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
  ScheduleCycleEntity,
  ScheduleEventEntity,
  ScheduleEventParticipantEntity,
  AuditLogEntity,
  OpentalkSlideEntity,
  PantryMenuItemEntity,
  PenaltyProofEntity,
];
export default entities;
