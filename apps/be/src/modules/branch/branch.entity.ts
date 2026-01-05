import { AbstractEntity } from '@src/common/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity('branches')
export class BranchEntity extends AbstractEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  address: string;
}
