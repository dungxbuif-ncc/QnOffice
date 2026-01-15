import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Start time filter (YYYY-MM-DD format)',
    example: '2025-12-15',
  })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiPropertyOptional({
    description: 'End time filter (YYYY-MM-DD format)',
    example: '2026-01-15',
  })
  @IsOptional()
  @IsString()
  end_time?: string;
}
