import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleType } from '@src/modules/schedule/schedule.algorith';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class CalendarQueryDto {
  @ApiPropertyOptional({
    description: 'Filter events from this date (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter events until this date (YYYY-MM-DD)',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by event type',
    enum: ScheduleType,
    example: ScheduleType.CLEANING,
  })
  @IsOptional()
  @IsEnum(ScheduleType)
  type?: ScheduleType;
}
