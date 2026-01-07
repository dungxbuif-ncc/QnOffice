import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { EventStatus } from '@qnoffice/shared';

export class ScheduleQueryDto {
  @ApiProperty({ required: false, description: 'Schedule type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false, enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  cycleId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
