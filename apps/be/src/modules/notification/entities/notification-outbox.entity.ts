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

@Entity('notification_outbox')
@Index(['status', 'scheduledAt'])
@Index(['eventType'])
@Index(['createdAt'])
export class NotificationOutboxEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  eventId: string; // UUID for idempotency

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
  aggregateId: string; // For tracking related events

  @Column({ nullable: true })
  aggregateType: string; // e.g., 'schedule', 'opentalk', 'cleaning'

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ default: 3 })
  maxRetries: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
