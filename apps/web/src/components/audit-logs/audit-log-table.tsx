'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AuditLog, AuditLogGroup, LogLevel } from '@qnoffice/shared';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { useState } from 'react';

interface AuditLogTableProps {
  logs: AuditLog[];
  groupedLogs: AuditLogGroup[];
}

const getLevelColor = (level: LogLevel) => {
  switch (level) {
    case LogLevel.ERROR:
      return 'bg-red-100 text-red-800';
    case LogLevel.WARN:
      return 'bg-yellow-100 text-yellow-800';
    case LogLevel.FATAL:
      return 'bg-red-900 text-red-100';
    case LogLevel.DEBUG:
      return 'bg-blue-100 text-blue-800';
    case LogLevel.TRACE:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-green-100 text-green-800';
  }
};

const formatTimestamp = (timestamp: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
};

interface LogEntryProps {
  log: AuditLog;
  isInGroup?: boolean;
}

function LogEntry({ log, isInGroup = false }: LogEntryProps) {
  const [showMetadata, setShowMetadata] = useState(false);

  return (
    <div
      className={`border-l-4 pl-4 py-3 ${
        isInGroup ? 'border-l-blue-200 bg-blue-50/50' : 'border-l-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <Badge className={getLevelColor(log.level)} variant="secondary">
              {log.level}
            </Badge>
            {log.context && (
              <Badge variant="outline" className="text-xs">
                {log.context}
              </Badge>
            )}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTimestamp(log.createdAt)}
            </span>
          </div>

          <p className="text-sm font-medium text-gray-900">{log.message}</p>

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMetadata(!showMetadata)}
                className="text-xs p-1 h-auto"
              >
                {showMetadata ? 'Hide' : 'Show'} Details
              </Button>
              {showMetadata && (
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface JourneyGroupProps {
  group: AuditLogGroup;
}

function JourneyGroup({ group }: JourneyGroupProps) {
  const [isOpen, setIsOpen] = useState(false);

  const duration =
    new Date(group.endTime).getTime() - new Date(group.startTime).getTime();
  const durationMs = Math.round(duration);
  const durationText =
    durationMs > 1000
      ? `${(durationMs / 1000).toFixed(1)}s`
      : `${durationMs}ms`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-l-4 border-l-blue-500">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <CardTitle className="text-base">
                  Journey: {group.journeyId.slice(0, 8)}...
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {group.logs.length} logs
                </Badge>
                {group.context && (
                  <Badge variant="secondary" className="text-xs">
                    {group.context}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatTimestamp(group.startTime)}</span>
                <span>•</span>
                <span>{durationText}</span>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {group.logs.map((log) => (
                <LogEntry key={log.id} log={log} isInGroup={true} />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function AuditLogTable({ logs, groupedLogs }: AuditLogTableProps) {
  // Separate grouped and ungrouped logs
  const groupedLogIds = new Set(
    groupedLogs.flatMap((group) => group.logs.map((log) => log.id)),
  );
  const ungroupedLogs = logs.filter((log) => !groupedLogIds.has(log.id));

  // Combine and sort all items by timestamp (newest first for display, but we'll reverse for bottom scroll)
  const allItems: Array<
    { type: 'group'; data: AuditLogGroup } | { type: 'log'; data: AuditLog }
  > = [
    ...groupedLogs.map((group) => ({ type: 'group' as const, data: group })),
    ...ungroupedLogs.map((log) => ({ type: 'log' as const, data: log })),
  ];

  // Sort by timestamp (most recent first)
  allItems.sort((a, b) => {
    const timeA =
      a.type === 'group'
        ? new Date(a.data.startTime).getTime()
        : new Date(a.data.createdAt).getTime();
    const timeB =
      b.type === 'group'
        ? new Date(b.data.startTime).getTime()
        : new Date(b.data.createdAt).getTime();
    return timeB - timeA;
  });

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No audit logs found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {allItems.map((item, index) => (
        <div key={`${item.type}-${index}`}>
          {item.type === 'group' ? (
            <JourneyGroup group={item.data} />
          ) : (
            <Card>
              <CardContent className="p-4">
                <LogEntry log={item.data} />
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}
