import { LogLevel } from '../enums/audit-log.enum';

export interface AuditLog {
  id: number;
  level: LogLevel;
  message: string;
  context?: string;
  journeyId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number | null;
  updatedBy: number | null;
}

export interface CreateAuditLogDto {
  level: LogLevel;
  message: string;
  context?: string;
  journeyId?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogSearchParams {
  level?: LogLevel;
  context?: string;
  journeyId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogGroup {
  journeyId: string;
  logs: AuditLog[];
  startTime: Date;
  endTime: Date;
  context?: string;
}
