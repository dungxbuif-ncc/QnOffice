import { AuditLogFilters } from '@/components/audit-logs/audit-log-filters';
import { getServerPaginationParams } from '@/shared/lib/base-paginated-service';
import { auditLogServerService } from '@/shared/services/server/audit-log-server-service';
import { AuditLogSearchParams } from '@qnoffice/shared';
import { AuditLogsPageClient } from './page-client';

interface AuditLogsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AuditLogsPage({
  searchParams,
}: AuditLogsPageProps) {
  const resolvedSearchParams = await searchParams;

  const params: AuditLogSearchParams = getServerPaginationParams(
    resolvedSearchParams || {},
    { defaultPage: 1, defaultPageSize: 50, defaultOrder: 'DESC' },
  );

  // Add search filters
  if (resolvedSearchParams.level) {
    params.level = resolvedSearchParams.level as any;
  }
  if (resolvedSearchParams.context) {
    params.context = resolvedSearchParams.context as string;
  }
  if (resolvedSearchParams.journeyId) {
    params.journeyId = resolvedSearchParams.journeyId as string;
  }
  if (resolvedSearchParams.startDate) {
    params.startDate = resolvedSearchParams.startDate as string;
  }
  if (resolvedSearchParams.endDate) {
    params.endDate = resolvedSearchParams.endDate as string;
  }

  const [logsResponse, contexts] = await Promise.all([
    auditLogServerService.getAll(params),
    auditLogServerService.getContexts(),
  ]);

  const logs = logsResponse?.result || [];
  const pagination = {
    page: logsResponse?.page || 1,
    pageSize: logsResponse?.pageSize || 50,
    total: logsResponse?.total || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Debug and monitor system operations with detailed logging
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{logs.length} logs</span>
          {pagination.total > logs.length && (
            <>
              <span>•</span>
              <span>{pagination.total} total</span>
            </>
          )}
        </div>
      </div>

      <AuditLogFilters contexts={contexts} />

      <AuditLogsPageClient logs={logs} />
    </div>
  );
}
