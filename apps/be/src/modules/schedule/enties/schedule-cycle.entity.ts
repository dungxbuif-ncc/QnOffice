import { CycleStatus, ScheduleType } from '@qnoffice/shared';
import { AbstractEntity } from '@src/common/database/abstract.entity';
import ScheduleEventEntity from '@src/modules/schedule/enties/schedule-event.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('schedule_cycles')
export default class ScheduleCycleEntity extends AbstractEntity {
  @Column()
  name: string;

  @Column({
    enum: ScheduleType,
    type: 'enum',
  })
  type: ScheduleType;

  @Column({
    type: 'enum',
    enum: CycleStatus,
    default: CycleStatus.DRAFT,
  })
  status: CycleStatus;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => ScheduleEventEntity, (event) => event.cycle)
  events: ScheduleEventEntity[];
}
