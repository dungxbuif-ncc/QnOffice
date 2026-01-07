import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationChannel } from '../enums/notification-event.enum';

@Entity('notification_subscriptions')
@Index(['userId', 'eventType'])
@Index(['staffId', 'eventType'])
export class NotificationSubscriptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  staffId: number;

  @Column()
  eventType: string; // Can be specific event or wildcard pattern

  @Column('simple-array')
  channels: NotificationChannel[];

  @Column({ default: true })
  enabled: boolean;

  @Column('jsonb', { nullable: true })
  preferences: Record<string, any>; // Custom preferences per subscription

  @Column('jsonb', { nullable: true })
  filters: Record<string, any>; // Filters for events (e.g., branch, priority)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
