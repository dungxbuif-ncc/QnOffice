import { AbstractAuditEntity } from '@src/common/database/abstract.entity';
import { UserRole } from '@src/common/enums/user-role.enum';
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

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STAFF,
  })
  role: UserRole;
}
