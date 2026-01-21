import { AbstractEntity } from '@src/common/database/abstract.entity';
import UserEntity from '@src/modules/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('orders')
export class OrderEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  userMezonId!: string;

  @Column()
  content: string;

  @Column({ type: 'varchar', length: 255 })
  messageId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  channelId?: string;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => UserEntity, (user) => user.orders)
  @JoinColumn({ name: 'user_mezon_id' })
  user: UserEntity;
}
