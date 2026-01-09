import { LogLevel } from '@qnoffice/shared';
import { AbstractAuditEntity } from '@src/common/database/abstract.entity';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
@Index(['createdAt'])
@Index(['journeyId'])
@Index(['level'])
@Index(['context'])
export default class AuditLogEntity extends AbstractAuditEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: LogLevel,
  })
  level: LogLevel;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  context?: string;

  @Column({ type: 'uuid', nullable: true })
  journeyId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;
}
