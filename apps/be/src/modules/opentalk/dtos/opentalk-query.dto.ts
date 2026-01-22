import { ApiProperty } from '@nestjs/swagger';
import { EventStatus, IOpentalkQueryDto } from '@qnoffice/shared';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class OpentalkQueryDto implements IOpentalkQueryDto {
  @ApiProperty({ required: false, description: 'Schedule type filter' })
  @IsOptional()
  @IsString()
  type?: string = 'OPENTALK';

  @ApiProperty({ required: false, enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiProperty({ required: false, description: 'Cycle ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cycleId?: number;

  @ApiProperty({ required: false, description: 'Start date filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Participant staff ID filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  participantId?: number;
}
