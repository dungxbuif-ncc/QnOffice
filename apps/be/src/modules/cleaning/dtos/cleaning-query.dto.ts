import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CleaningQueryDto {
  @ApiPropertyOptional({ description: 'Filter by event status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by cycle ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cycleId?: number;

  @ApiPropertyOptional({ description: 'Filter by participant staff ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  participantId?: number;

  @ApiPropertyOptional({
    description: 'Filter events from this date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter events until this date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by event ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;
}
