import StaffEntity from '@src/modules/staff/staff.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import ScheduleEventEntity from './schedule-event.entity';

@Entity('schedule_event_participants')
export default class ScheduleEventParticipantEntity {
  @PrimaryColumn()
  eventId: number;

  @PrimaryColumn()
  staffId: number;

  @ManyToOne(() => ScheduleEventEntity, (event) => event.eventParticipants)
  @JoinColumn({ name: 'event_id' })
  event: ScheduleEventEntity;

  @ManyToOne(() => StaffEntity)
  @JoinColumn({ name: 'staff_id' })
  staff: StaffEntity;
}
