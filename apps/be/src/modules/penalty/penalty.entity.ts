import { PenaltyStatus } from '@qnoffice/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Campaign } from '../campaign/campaign.entity';
import { PenaltyType } from '../penalty-type/penalty-type.entity';

@Entity('penalties')
export class Penalty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => PenaltyType, (penaltyType) => penaltyType.penalties)
  @JoinColumn({ name: 'penalty_type_id' })
  penaltyType: PenaltyType;

  @Column()
  penalty_type_id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  reason: string;

  @Column({ type: 'json', nullable: true })
  evidence_urls: string[]; // Array of image URLs

  @Column({
    type: 'enum',
    enum: PenaltyStatus,
    default: PenaltyStatus.UNPAID,
  })
  status: PenaltyStatus;

  @ManyToOne(() => Campaign, (campaign) => campaign.penalties, {
    nullable: true,
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ nullable: true })
  campaign_id: number;

  @Column()
  created_by: number; // HR user ID

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
