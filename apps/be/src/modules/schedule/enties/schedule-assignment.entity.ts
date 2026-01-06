import { AbstractEntity } from '@src/common/database/abstract.entity';
import ScheduleCycleEntity from '@src/modules/schedule/enties/schedule-cycle.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

export enum AssignmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  SWAPPED = 'swapped',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped', // Skipped due to holiday or other reason
}

/**
 * Generic Schedule Assignment - unified table for all schedule types
 * Uses type field to distinguish between different schedule types (opentalk, cleaning, etc.)
 * Links to specific type tables via referenceId for additional data
 */
@Entity('schedule_assignments')
export default class ScheduleAssignmentEntity extends AbstractEntity {
  @Column()
  cycleId: number; // Reference to schedule_cycles

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'opentalk', 'cleaning', etc.

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int' })
  sequenceInCycle: number; // Position in the cycle (1, 2, 3, ...)

  @Column('int', { array: true })
  staffIds: number[]; // Array of staff IDs (1 for opentalk, 2+ for cleaning)

  @Column({
    type: 'varchar',
    length: 20,
    default: AssignmentStatus.SCHEDULED,
  })
  status: AssignmentStatus;

  @Column({ type: 'int', nullable: true })
  referenceId: number | null; // ID in specific type table (e.g., opentalk_schedules.id)

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceTable: string | null; // Name of the specific type table

  @Column({ type: 'boolean', default: false })
  isRescheduled: boolean; // True if this was rescheduled due to holiday/staff change

  @Column({ type: 'date', nullable: true })
  originalDate: Date | null; // Original date before rescheduling

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null; // Type-specific data

  // Relations
  @ManyToOne(() => ScheduleCycleEntity)
  @JoinColumn({ name: 'cycle_id' })
  cycle: ScheduleCycleEntity;

  // Note: staffIds is an array, so we can't use @ManyToOne here
  // Access staff through service layer queries
}
