import { AbstractAuditEntity } from '@src/common/database/abstract.entity';
import { OrderEntity } from '@src/modules/order/entities/order.entity';
import { Column, Entity, OneToMany } from 'typeorm';

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

  @OneToMany(() => OrderEntity, (order) => order.user)
  orders: OrderEntity[];
}
