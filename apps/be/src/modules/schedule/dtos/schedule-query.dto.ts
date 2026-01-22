import { ApiProperty } from '@nestjs/swagger';
import { EventStatus, IScheduleQueryDto } from '@qnoffice/shared';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ScheduleQueryDto implements IScheduleQueryDto {
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
