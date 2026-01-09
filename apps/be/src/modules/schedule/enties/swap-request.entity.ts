import { SwapRequestStatus } from '@qnoffice/shared';
import { AbstractEntity } from '@src/common/database/abstract.entity';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('swap_requests')
export default class SwapRequestEntity extends AbstractEntity {
  @Column()
  fromEventId: number;

  @Column()
  toEventId: number;

  @Column()
  requesterId: number;

  @Column()
  reason: string;

  @Column({
    type: 'enum',
    enum: SwapRequestStatus,
    default: SwapRequestStatus.PENDING,
  })
  status: SwapRequestStatus;

  @Column({ nullable: true })
  reviewNote?: string;

  @ManyToOne(() => ScheduleEventEntity)
  @JoinColumn({ name: 'from_event_id' })
  fromEvent: ScheduleEventEntity;

  @ManyToOne(() => ScheduleEventEntity)
  @JoinColumn({ name: 'to_event_id' })
  toEvent: ScheduleEventEntity;

  @ManyToOne(() => StaffEntity)
  @JoinColumn({ name: 'requester_id' })
  requester: StaffEntity;
}
