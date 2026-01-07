import { StaffStatus, UserRole } from '@qnoffice/shared';
import { AbstractEntity } from '@src/common/database/abstract.entity';
import { BranchEntity } from '@src/modules/branch/branch.entity';
import UserEntity from '@src/modules/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity('staffs')
export default class StaffEntity extends AbstractEntity {
  @Column({ unique: true })
  email: string;

  @Column({
    type: 'int',
    default: StaffStatus.ACTIVE,
  })
  status: StaffStatus;

  @Column({ nullable: true })
  userId: string | null;

  @Column({
    type: 'int',
  })
  role: UserRole;

  @Column({ unique: false })
  branchId: number;

  @OneToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => BranchEntity, (branch) => branch.staffs, { eager: true })
  @JoinColumn({ name: 'branch_id' })
  branch: BranchEntity;
}
