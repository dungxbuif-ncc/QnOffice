import { LogLevel } from '@qnoffice/shared';
import { AppPaginateOptionsDto } from '@src/common/dtos/page-options.dto';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class AuditLogSearchParamsDto extends AppPaginateOptionsDto {
  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  journeyId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
