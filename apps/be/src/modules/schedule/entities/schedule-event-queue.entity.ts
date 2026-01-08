import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QueueOperationType {
  SHIFT_EVENT = 'SHIFT_EVENT', // Move event to different date
  CANCEL_EVENT = 'CANCEL_EVENT', // Cancel event due to holiday
  REASSIGN_PARTICIPANT = 'REASSIGN_PARTICIPANT', // Reassign staff
  UPDATE_EVENT = 'UPDATE_EVENT', // Generic update
}

export enum QueueStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('schedule_event_queue')
@Index(['status', 'createdAt'])
@Index(['eventId'])
export class ScheduleEventQueueEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @Column({
    type: 'enum',
    enum: QueueOperationType,
  })
  operationType: QueueOperationType;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.PENDING,
  })
  status: QueueStatus;

  @Column('jsonb')
  metadata: {
    reason: string; // Why this operation is needed
    triggeredBy: string; // e.g., "holiday-added-123", "staff-offboarded-456"
    oldDate?: string;
    newDate?: string;
    holidayId?: number;
    holidayName?: string;
    staffId?: number;
    [key: string]: any;
  };

  @Column('jsonb', { nullable: true })
  result: {
    success: boolean;
    message?: string;
    notificationsSent?: number;
    updatedFields?: string[];
    error?: string;
  };

  @Column({ default: 0 })
  retryCount: number;

  @Column({ default: 3 })
  maxRetries: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
