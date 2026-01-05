import { AbstractEntity } from '@src/common/database/abstract.entity';
import UserEntity from '@src/modules/user/user.entity';
import { Column, JoinColumn, OneToOne } from 'typeorm';
export enum StaffStatus {
  ACTIVE = 0,
  ON_LEAVE = 1,
  LEAVED = 2,
}

export default class StaffEntity extends AbstractEntity {
  @Column({
    type: 'int',
    default: StaffStatus.ACTIVE,
  })
  status: StaffStatus;

  @Column({})
  userId: string;

  @OneToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
