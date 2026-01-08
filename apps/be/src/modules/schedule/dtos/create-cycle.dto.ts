import { ApiProperty } from '@nestjs/swagger';
import { ScheduleType } from '@qnoffice/shared';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCycleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Cycle type (OPENTALK or CLEANING)' })
  @IsEnum(ScheduleType)
  type: ScheduleType;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
