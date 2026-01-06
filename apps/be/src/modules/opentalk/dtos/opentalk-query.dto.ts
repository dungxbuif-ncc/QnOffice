import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { EventStatus } from '../../schedule/enties/schedule-event.entity';

export class OpentalkQueryDto {
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
