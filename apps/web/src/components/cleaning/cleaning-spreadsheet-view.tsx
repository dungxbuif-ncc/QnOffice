'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStatusBadgeProps } from '@/shared/lib/utils';
import { Download, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CleaningSpreadsheetViewProps {
  events: any[];
  cycles: any[];
}

export function CleaningSpreadsheetView({
  events,
  cycles,
}: CleaningSpreadsheetViewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getParticipantNames = (eventParticipants: any[]) => {
    if (!eventParticipants?.length) return 'No participants';

    return eventParticipants
      .map(
        (participant) =>
          participant.staff?.user?.email ||
          participant.staff?.email ||
          'Unknown',
      )
      .join(' & ');
  };

  const handleExportData = () => {
    // Create CSV content
    const headers = ['Date', 'Day', 'Participants', 'Status', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...events
        .map((event) => [
          event.eventDate,
          formatDate(event.eventDate),
          `"${getParticipantNames(event.eventParticipants)}"`,
          event.status,
          `"${event.notes || ''}"`,
        ])
        .map((row) => row.join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaning-schedule-all-cycles.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Schedule exported successfully');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Data refreshed');
    }, 1000);
  };

  // Group events by cycle
  const eventsByCycle = useMemo(() => {
    const groupedByCycle: { [key: string]: any[] } = {};

    events.forEach((event) => {
      const cycleKey = `cycle-${event.cycleId}`;
      if (!groupedByCycle[cycleKey]) {
        groupedByCycle[cycleKey] = [];
      }
      groupedByCycle[cycleKey].push(event);
    });

    // Sort events within each cycle by date
    Object.keys(groupedByCycle).forEach((cycleKey) => {
      groupedByCycle[cycleKey].sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
      );
    });

    return groupedByCycle;
  }, [events]);

  const getCycleName = (cycleId: number) => {
    const cycle = cycles.find((c) => c.id === cycleId);
    return cycle?.name || `Cycle ${cycleId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold">Cleaning Schedule</h2>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Schedule View</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(eventsByCycle).length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Cleaning Cycles Found</CardTitle>
                  <CardDescription>
                    No cleaning events have been scheduled yet.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              Object.entries(eventsByCycle).map(([cycleKey, cycleEvents]) => {
                const cycleId = parseInt(cycleKey.replace('cycle-', ''));
                return (
                  <Card key={cycleKey}>
                    <CardHeader>
                      <CardTitle>{getCycleName(cycleId)}</CardTitle>
                      <CardDescription>
                        {cycleEvents.length} cleaning session
                        {cycleEvents.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-96 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Day</TableHead>
                              <TableHead>Participants</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Notes</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cycleEvents.map((event) => (
                              <TableRow key={event.id}>
                                <TableCell className="font-medium">
                                  {event.eventDate}
                                </TableCell>
                                <TableCell>
                                  {formatDate(event.eventDate)}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {event.eventParticipants?.length > 0 ? (
                                      event.eventParticipants.map(
                                        (participant: any, idx: number) => (
                                          <div key={idx} className="text-sm">
                                            {participant.staff?.user?.email ||
                                              participant.staff?.email ||
                                              'Unknown'}
                                          </div>
                                        ),
                                      )
                                    ) : (
                                      <span className="text-muted-foreground text-sm">
                                        No participants assigned
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    {...getStatusBadgeProps(event.status)}
                                  />
                                </TableCell>
                                <TableCell className="max-w-xs">
                                  <div className="truncate" title={event.notes}>
                                    {event.notes || 'No notes'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm">
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
