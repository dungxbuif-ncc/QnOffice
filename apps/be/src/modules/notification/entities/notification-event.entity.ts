import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  NotificationEventStatus,
  NotificationEventType,
  NotificationPriority,
} from '../enums/notification-event.enum';

@Entity('notification_events')
@Index(['eventType', 'status'])
@Index(['createdAt'])
export class NotificationEventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: NotificationEventType,
  })
  eventType: NotificationEventType;

  @Column('jsonb')
  payload: Record<string, any>;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationEventStatus,
    default: NotificationEventStatus.PENDING,
  })
  status: NotificationEventStatus;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  staffId: number;

  @Column({ nullable: true })
  branchId: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ default: 3 })
  maxRetries: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
