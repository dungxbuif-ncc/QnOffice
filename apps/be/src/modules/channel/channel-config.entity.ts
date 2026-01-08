import { MezonChannelType } from '@qnoffice/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('channel_config')
export default class ChannelConfigEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  channelType: MezonChannelType;

  @Column({ type: 'varchar', length: 255 })
  channelId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  channelName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
