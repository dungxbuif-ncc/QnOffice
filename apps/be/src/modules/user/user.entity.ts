import { AbstractAuditEntity } from '@src/common/database/abstract.entity';
import { Column, Entity } from 'typeorm';

@Entity('users')
export default class UserEntity extends AbstractAuditEntity {
  @Column({ primary: true, unique: true })
  mezonId: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  avatar?: string;
}
