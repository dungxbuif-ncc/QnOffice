import { ApiProperty } from '@nestjs/swagger';
import { CycleStatus } from '@qnoffice/shared';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateOpentalkCycleDto {
  @ApiProperty({ description: 'Name of the opentalk cycle' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Start date of the cycle' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ description: 'End date of the cycle' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiProperty({ description: 'Description of the cycle', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: CycleStatus,
    description: 'Cycle status',
    required: false,
  })
  @IsOptional()
  @IsEnum(CycleStatus)
  status?: CycleStatus;
}
