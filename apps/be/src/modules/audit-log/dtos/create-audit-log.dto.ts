import { LogLevel } from '@qnoffice/shared';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAuditLogDto {
  @IsEnum(LogLevel)
  level: LogLevel;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  journeyId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
