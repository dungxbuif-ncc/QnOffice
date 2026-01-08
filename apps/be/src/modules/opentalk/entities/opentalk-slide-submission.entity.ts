import { AbstractEntity } from '@src/common/database/abstract.entity';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';
import StaffEntity from '@src/modules/staff/staff.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('opentalk_slide_submissions')
export default class OpentalkSlideSubmissionEntity extends AbstractEntity {
  @Column()
  eventId: number;

  @Column()
  slidesUrl: string;

  @Column({ nullable: true })
  topic: string;

  @Column()
  submittedBy: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => ScheduleEventEntity)
  @JoinColumn({ name: 'event_id' })
  event: ScheduleEventEntity;

  @ManyToOne(() => StaffEntity)
  @JoinColumn({ name: 'submitted_by' })
  submitter: StaffEntity;
}
