import {
  AuditLog,
  AuditLogSearchParams,
  IPaginationDto,
  LogLevel,
} from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

class AuditLogServerService extends BaseServerService {
  async getAll(
    searchParams: AuditLogSearchParams,
  ): Promise<IPaginationDto<AuditLog>> {
    const params = new URLSearchParams();

    if (searchParams.page) params.append('page', searchParams.page.toString());
    if (searchParams.pageSize)
      params.append('pageSize', searchParams.pageSize.toString());
    if (searchParams.level) params.append('level', searchParams.level);
    if (searchParams.context) params.append('context', searchParams.context);
    if (searchParams.journeyId)
      params.append('journeyId', searchParams.journeyId);
    if (searchParams.startDate)
      params.append('startDate', searchParams.startDate);
    if (searchParams.endDate) params.append('endDate', searchParams.endDate);

    const response = await this.get<IPaginationDto<AuditLog>>(
      `/audit-logs?${params.toString()}`,
    );
    return response.data;
  }

  async getByJourneyId(journeyId: string): Promise<AuditLog[]> {
    const response = await this.get<AuditLog[]>(
      `/audit-logs/journey/${journeyId}`,
    );
    return response.data;
  }

  async getContexts(): Promise<string[]> {
    const response = await this.get<string[]>('/audit-logs/contexts');
    return response.data;
  }

  async getStats(): Promise<{
    totalLogs: number;
    last24Hours: number;
    levelStats: { level: LogLevel; count: number }[];
  }> {
    const response = await this.get<{
      totalLogs: number;
      last24Hours: number;
      levelStats: { level: LogLevel; count: number }[];
    }>('/audit-logs/stats');
    return response.data;
  }

  async cleanup(days: number): Promise<{ message: string }> {
    const response = await this.delete<{ message: string }>(
      `/audit-logs/cleanup/${days}`,
    );
    return response.data;
  }
}

export const auditLogServerService = new AuditLogServerService();
