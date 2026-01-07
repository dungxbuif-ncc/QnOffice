import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject, IsOptional } from 'class-validator';
import {
  NotificationEventType,
  NotificationPriority,
} from '../enums/notification-event.enum';

export class CreateNotificationEventDto {
  @ApiProperty({
    description: 'Type of the notification event',
    enum: NotificationEventType,
  })
  @IsEnum(NotificationEventType)
  eventType: NotificationEventType;

  @ApiProperty({
    description: 'Event payload data',
    type: 'object',
  })
  @IsObject()
  payload: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata for the event',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Priority level of the event',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    description: 'User ID for user-specific events',
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Staff ID for staff-specific events',
  })
  @IsOptional()
  @IsNumber()
  staffId?: number;

  @ApiPropertyOptional({
    description: 'Branch ID for branch-specific events',
  })
  @IsOptional()
  @IsNumber()
  branchId?: number;

  @ApiPropertyOptional({
    description: 'When the event should be processed',
  })
  @IsOptional()
  scheduledAt?: Date;
}
