import {
  EventStatus,
  IOpentalEventMetadata,
  ScheduleType,
} from '@qnoffice/shared';
import { AbstractEntity } from '@src/common/database/abstract.entity';
import ScheduleEventParticipantEntity from '@src/modules/schedule/enties/schedule-event-participant.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import ScheduleCycleEntity from './schedule-cycle.entity';

@Entity('schedule_events')
export default class ScheduleEventEntity extends AbstractEntity {
  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: ScheduleType,
  })
  type: ScheduleType;

  @Column()
  cycleId: number;

  @Column({
    type: 'date',
  })
  eventDate: string;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status: EventStatus;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: IOpentalEventMetadata | null;

  @ManyToOne(() => ScheduleCycleEntity)
  @JoinColumn({ name: 'cycle_id' })
  cycle: ScheduleCycleEntity;

  @OneToMany(
    () => ScheduleEventParticipantEntity,
    (participant) => participant.event,
    {
      cascade: true,
    },
  )
  eventParticipants: ScheduleEventParticipantEntity[];

  get participants(): StaffEntity[] {
    return this.eventParticipants?.map((ep) => ep.staff) || [];
  }
}
