import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import {
  NotificationEventStatus,
  NotificationEventType,
} from '../enums/notification-event.enum';

export class GetNotificationsQueryDto {
  @ApiPropertyOptional({
    description: 'User ID to filter notifications',
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Staff ID to filter notifications',
  })
  @IsOptional()
  @IsNumber()
  staffId?: number;

  @ApiPropertyOptional({
    description: 'Filter by read status',
  })
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class GetEventsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by event type',
    enum: NotificationEventType,
  })
  @IsOptional()
  @IsEnum(NotificationEventType)
  eventType?: NotificationEventType;

  @ApiPropertyOptional({
    description: 'Filter by event status',
    enum: NotificationEventStatus,
  })
  @IsOptional()
  @IsEnum(NotificationEventStatus)
  status?: NotificationEventStatus;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
