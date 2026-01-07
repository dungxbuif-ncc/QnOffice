import { BranchEntity } from '@src/modules/branch/branch.entity';
import { Campaign } from '@src/modules/campaign/campaign.entity';
import { Channel } from '@src/modules/channel/channel.entity';
import HolidayEntity from '@src/modules/holiday/holiday.entity';
import { NotificationEventEntity } from '@src/modules/notification/entities/notification-event.entity';
import { NotificationOutboxEntity } from '@src/modules/notification/entities/notification-outbox.entity';
import { NotificationSubscriptionEntity } from '@src/modules/notification/entities/notification-subscription.entity';
import { NotificationEntity } from '@src/modules/notification/entities/notification.entity';
import SwapRequestEntity from '@src/modules/opentalk/swap-request.entity';
import { PenaltyType } from '@src/modules/penalty-type/penalty-type.entity';
import { Penalty } from '@src/modules/penalty/penalty.entity';
import ScheduleCycleEntity from '@src/modules/schedule/enties/schedule-cycle.entity';
import ScheduleEventParticipantEntity from '@src/modules/schedule/enties/schedule-event-participant.entity';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import UserEntity from '@src/modules/user/user.entity';

const entities = [
  UserEntity,
  BranchEntity,
  StaffEntity,
  Channel,
  HolidayEntity,
  SwapRequestEntity,
  Penalty,
  PenaltyType,
  Campaign,
  ScheduleCycleEntity,
  ScheduleEventEntity,
  ScheduleEventParticipantEntity,
  NotificationEntity,
  NotificationEventEntity,
  NotificationOutboxEntity,
  NotificationSubscriptionEntity,
];
export default entities;
