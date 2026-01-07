import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationChannel } from '../enums/notification-event.enum';

export class CreateSubscriptionDto {
  @ApiPropertyOptional({
    description: 'User ID for the subscription',
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Staff ID for the subscription',
  })
  @IsOptional()
  @IsNumber()
  staffId?: number;

  @ApiProperty({
    description: 'Event type pattern to subscribe to (supports wildcards)',
  })
  @IsString()
  eventType: string;

  @ApiProperty({
    description: 'Notification channels for this subscription',
    type: [String],
    enum: NotificationChannel,
    isArray: true,
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiPropertyOptional({
    description: 'Whether the subscription is enabled',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Custom preferences for this subscription',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Filters for events (e.g., branch, priority)',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}
