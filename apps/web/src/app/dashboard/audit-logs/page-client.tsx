'use client';

import { AuditLogTable } from '@/components/audit-logs/audit-log-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditLog, AuditLogGroup } from '@qnoffice/shared';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

interface AuditLogsPageClientProps {
  logs: AuditLog[];
}

export function AuditLogsPageClient({ logs }: AuditLogsPageClientProps) {
  const router = useRouter();

  // Group logs by journeyId
  const groupedLogs = useMemo(() => {
    const groups = new Map<string, AuditLog[]>();

    logs.forEach((log) => {
      if (log.journeyId) {
        if (!groups.has(log.journeyId)) {
          groups.set(log.journeyId, []);
        }
        groups.get(log.journeyId)!.push(log);
      }
    });

    // Convert to AuditLogGroup format
    const result: AuditLogGroup[] = Array.from(groups.entries()).map(
      ([journeyId, journeyLogs]) => {
        // Sort logs within each journey by timestamp
        journeyLogs.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

        const startTime = journeyLogs[0].createdAt;
        const endTime = journeyLogs[journeyLogs.length - 1].createdAt;
        const context = journeyLogs[0].context;

        return {
          journeyId,
          logs: journeyLogs,
          startTime,
          endTime,
          context,
        };
      },
    );

    // Sort groups by start time (most recent first)
    result.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );

    return result;
  }, [logs]);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Log</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <AuditLogTable logs={logs} groupedLogs={groupedLogs} />
      </CardContent>
    </Card>
  );
}
