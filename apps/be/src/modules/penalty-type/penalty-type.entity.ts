import { AbstractEntity } from '@src/common/database/abstract.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Penalty } from '../penalty/penalty.entity';

@Entity('penalty_types')
export class PenaltyType extends AbstractEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @OneToMany(() => Penalty, (penalty) => penalty.penaltyType)
  penalties: Penalty[];
}
