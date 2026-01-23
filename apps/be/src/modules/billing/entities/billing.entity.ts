import { AbstractEntity } from '@src/common/database/abstract.entity';
import { OrderEntity } from '@src/modules/order/entities/order.entity';
import UserEntity from '@src/modules/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity('billings')
export class BillingEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 255, name: 'user_mezon_id' })
  userMezonId!: string;

  @Column({ type: 'varchar', length: 255, name: 'channel_id' })
  channelId: string;

  @Column({ type: 'date' })
  date: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_mezon_id' })
  user: UserEntity;

  @OneToMany(() => OrderEntity, (order) => order.billing)
  orders: OrderEntity[];
}
