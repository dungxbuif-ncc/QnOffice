import { AbstractEntity } from '@src/common/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity('holidays')
export default class HolidayEntity extends AbstractEntity {
  @Column({ type: 'date' })
  date: Date | string;

  @Column()
  name: string;
}
