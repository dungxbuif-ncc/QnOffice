import { AbstractEntity } from '@src/common/database/abstract.entity';
import { BillingEntity } from '@src/modules/billing/entities/billing.entity';
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

  @Column({ type: 'int', nullable: true })
  billingId: number | null;

  @Column({ type: 'boolean', default: false, name: 'is_paid' })
  isPaid: boolean;

  @Column({ type: 'int', nullable: true })
  amount?: number;

  @ManyToOne(() => UserEntity, (user) => user.orders)
  @JoinColumn({ name: 'user_mezon_id' })
  user: UserEntity;

  @ManyToOne(() => BillingEntity, (billing) => billing.orders)
  @JoinColumn({ name: 'billing_id' })
  billing: BillingEntity;
}
