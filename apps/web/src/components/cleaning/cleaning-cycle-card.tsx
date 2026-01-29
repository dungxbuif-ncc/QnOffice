'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { hasPermission, PERMISSIONS } from '@/shared/auth';
import { useAuth } from '@/shared/contexts/auth-context';
import { cn, formatDateVN, getStatusBadgeProps } from '@/shared/utils';
import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface CleaningCycleCardProps {
  cycleId: number;
  cycleName: string;
  cycleEvents: any[];
  selectedParticipants: any[];
  onParticipantToggle: (
    eventId: number,
    staffId: number,
    email: string,
    cycleId: number,
  ) => void;
}

export function CleaningCycleCard({
  cycleId,
  cycleName,
  cycleEvents,
  selectedParticipants,
  onParticipantToggle,
}: CleaningCycleCardProps) {
  const { user } = useAuth();
  // Determine if past based on latest event
  const isPast = useMemo(() => {
    if (!cycleEvents.length) return false;
    // Assume sorted or find max
    const dates = cycleEvents.map((e) => new Date(e.eventDate).getTime());
    const maxDate = Math.max(...dates);
    return maxDate < Date.now();
  }, [cycleEvents]);

  const [isOpen, setIsOpen] = useState(!isPast);
  const canManageCleaning = hasPermission(
    user?.role,
    PERMISSIONS.MANAGE_CLEANING,
  );

  useEffect(() => {
    if (!isOpen) return;

    // Find first future or today event
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetEvent = cycleEvents
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
      )
      .find((e) => new Date(e.eventDate) >= today);

    if (targetEvent) {
      // Use setTimeout to ensure DOM is ready/expanded
      setTimeout(() => {
        const element = document.getElementById(
          `cleaning-event-${targetEvent.id}`,
        );
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [cycleEvents, isOpen]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={isPast ? 'border-muted' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto hover:bg-transparent"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CardTitle
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
              >
                <span>{cycleName}</span>
                <Badge variant={isPast ? 'secondary' : 'default'}>
                  {isPast ? 'Past' : 'Active'}
                </Badge>
              </CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              {cycleEvents.length} phiên trực nhật
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Người trực</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycleEvents.map((event) => {
                    const isPast =
                      new Date(event.eventDate).getTime() < Date.now();
                    const isCompleted =
                      event.status === 'COMPLETED' ||
                      event.status === 'CANCELLED';
                    const isDisabled = isPast || isCompleted;

                    const isCurrentUser =
                      user?.email &&
                      event.eventParticipants?.some(
                        (p: any) =>
                          p.staff?.user?.email === user.email ||
                          p.staff?.email === user.email,
                      );

                    return (
                      <TableRow
                        key={event.id}
                        id={`cleaning-event-${event.id}`}
                        className={cn(
                          isDisabled ? 'opacity-60 bg-gray-50' : '',
                          isCurrentUser
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500'
                            : '',
                        )}
                      >
                        <TableCell>{formatDateVN(event.eventDate)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {event.eventParticipants?.length > 0 ? (
                              event.eventParticipants.map(
                                (participant: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center space-x-2"
                                  >
                                    {event.status !== 'COMPLETED' &&
                                      canManageCleaning && (
                                        <Checkbox
                                          checked={selectedParticipants.some(
                                            (p) =>
                                              p.eventId === event.id &&
                                              p.staffId === participant.staffId,
                                          )}
                                          onCheckedChange={() =>
                                            onParticipantToggle(
                                              event.id,
                                              participant.staffId,
                                              participant.staff?.user?.email ||
                                                participant.staff?.email ||
                                                'Unknown',
                                              cycleId,
                                            )
                                          }
                                          disabled={isDisabled}
                                        />
                                      )}
                                    <span className="text-sm">
                                      {participant.staff?.user?.email ||
                                        participant.staff?.email ||
                                        'Unknown'}
                                    </span>
                                  </div>
                                ),
                              )
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Chưa có người trực
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge {...getStatusBadgeProps(event.status)} />
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={event.notes}>
                            {event.notes || 'Không có ghi chú'}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
