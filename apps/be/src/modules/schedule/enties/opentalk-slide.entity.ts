import { AbstractEntity } from '@src/common/database/abstract.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import ScheduleEventEntity from './schedule-event.entity';

export enum SlideStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('opentalk_slides')
export default class OpentalkSlideEntity extends AbstractEntity {
  @Column()
  eventId: number;

  @Column()
  staffId: number;

  @Column({ nullable: true })
  slideUrl?: string;

  @Column({
    type: 'enum',
    enum: SlideStatus,
    default: SlideStatus.PENDING,
  })
  status: SlideStatus;

  @Column({ nullable: true })
  topic?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  submittedAt?: Date;

  @Column({ nullable: true })
  reviewedAt?: Date;

  @Column({ nullable: true })
  reviewedBy?: number;

  @Column({ type: 'text', nullable: true })
  reviewNote?: string;

  @ManyToOne(() => ScheduleEventEntity)
  @JoinColumn({ name: 'event_id' })
  event: ScheduleEventEntity;

  @ManyToOne(() => StaffEntity)
  @JoinColumn({ name: 'staff_id' })
  staff: StaffEntity;

  @ManyToOne(() => StaffEntity, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer?: StaffEntity;
}
