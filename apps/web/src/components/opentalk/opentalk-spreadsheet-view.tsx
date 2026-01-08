'use client';

import { UpdateSlideDialog } from '@/components/opentalk/update-slide-dialog';
import { ViewSlideDialog } from '@/components/opentalk/view-slide-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { hasPermission, PERMISSIONS } from '@/shared/auth/permissions';
import { useAuth } from '@/shared/contexts/auth-context';
import { opentalkClientService } from '@/shared/services/client/opentalk-client-service';
import { getStatusBadgeProps } from '@/shared/utils';
import { UserAuth } from '@qnoffice/shared';
import {
  ArrowRightLeft,
  Calendar,
  Check,
  FileText,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface OpentalkSpreadsheetViewProps {
  events: any[];
  cycles: any[];
  user?: UserAuth;
}

export function OpentalkSpreadsheetView({
  events = [],
  cycles = [],
  user: propUser,
}: OpentalkSpreadsheetViewProps) {
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [editingTopic, setEditingTopic] = useState<number | null>(null);
  const [editedTopicValue, setEditedTopicValue] = useState<string>('');
  const [slideDialogOpen, setSlideDialogOpen] = useState(false);
  const [selectedEventForSlide, setSelectedEventForSlide] = useState<any>(null);
  const userStaffId = user?.staffId;

  const validEvents = Array.isArray(events) ? events : [];
  const validCycles = Array.isArray(cycles) ? cycles : [];

  // Group events by cycle
  const eventsByCycle = validCycles.map((cycle) => ({
    cycle,
    events: validEvents.filter((event) => event.cycleId === cycle.id),
  }));

  // Sort cycles: past cycles first, then future cycles
  eventsByCycle.sort((a, b) => {
    const aEndDate = new Date(a.cycle.endDate);
    const bEndDate = new Date(b.cycle.endDate);
    const now = new Date();

    // If both are past or both are future, sort by end date
    if (
      (aEndDate < now && bEndDate < now) ||
      (aEndDate >= now && bEndDate >= now)
    ) {
      return aEndDate.getTime() - bEndDate.getTime();
    }

    // Past cycles come first
    if (aEndDate < now) return -1;
    if (bEndDate < now) return 1;

    return 0;
  });

  const handleEventSelect = (eventId: number) => {
    setSelectedEvents((prev) => {
      if (prev.includes(eventId)) {
        return prev.filter((id) => id !== eventId);
      } else if (prev.length < 2) {
        return [...prev, eventId];
      } else {
        // Replace first selected with new one
        return [prev[1], eventId];
      }
    });
  };

  const canEditTopic = (event: any) => {
    if (event.status === 'COMPLETED') {
      return false;
    }

    if (hasPermission(user?.role, PERMISSIONS.EDIT_OPENTALK_TOPIC)) {
      return true;
    }

    const userIsOrganizer = event.eventParticipants?.some(
      (participant: any) => participant.staffId === userStaffId,
    );
    return userIsOrganizer;
  };

  const canEditSlide = (event: any) => {
    const userIsPresenter = event.eventParticipants?.some(
      (participant: any) => participant.staffId === userStaffId,
    );
    return userIsPresenter;
  };

  const handleTopicEdit = (eventId: number, currentTopic: string) => {
    console.log(
      'Starting topic edit for event:',
      eventId,
      'with topic:',
      currentTopic,
    );
    setEditingTopic(eventId);
    setEditedTopicValue(currentTopic || '');
  };

  const handleTopicSave = async (eventId: number) => {
    try {
      await opentalkClientService.updateEvent(eventId, {
        title: editedTopicValue,
      });
      toast.success('Topic updated successfully');
      setEditingTopic(null);
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update topic');
      console.error(error);
    }
  };

  const handleTopicCancel = () => {
    setEditingTopic(null);
    setEditedTopicValue('');
  };

  const handleSwapEvents = async () => {
    if (selectedEvents.length !== 2) {
      toast.error('Please select exactly 2 events to swap');
      return;
    }

    setIsSwapping(true);
    try {
      await opentalkClientService.swapEvents(
        selectedEvents[0],
        selectedEvents[1],
      );
      toast.success('Events swapped successfully');
      setSelectedEvents([]);
      // Refresh page or update data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to swap events');
      console.error(error);
    } finally {
      setIsSwapping(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isPastCycle = (cycle: any) => {
    return new Date(cycle.endDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Swap Controls */}
      {selectedEvents.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-900">
                  {selectedEvents.length === 1
                    ? '1 event selected. Select one more to swap.'
                    : `2 events selected. Ready to swap.`}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEvents([])}
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  disabled={selectedEvents.length !== 2 || isSwapping}
                  onClick={handleSwapEvents}
                >
                  {isSwapping ? 'Swapping...' : 'Swap Events'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {eventsByCycle.map(({ cycle, events: cycleEvents }) => (
          <Card
            key={cycle.id}
            className={isPastCycle(cycle) ? 'border-muted' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{cycle.name}</span>
                    <Badge
                      variant={isPastCycle(cycle) ? 'secondary' : 'default'}
                    >
                      {isPastCycle(cycle) ? 'Past' : 'Active'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {cycleEvents.length} events
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cycleEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No events scheduled for this cycle
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Select</TableHead>
                      <TableHead className="w-[140px]">Date</TableHead>
                      <TableHead className="w-[250px]">Topic</TableHead>
                      <TableHead className="w-[200px]">Presenter</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cycleEvents
                      .sort(
                        (a, b) =>
                          new Date(a.eventDate).getTime() -
                          new Date(b.eventDate).getTime(),
                      )
                      .map((event) => (
                        <TableRow
                          key={event.id}
                          className={`hover:bg-muted/50 ${
                            selectedEvents.includes(event.id)
                              ? 'bg-blue-50 border-blue-200'
                              : ''
                          }`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedEvents.includes(event.id)}
                              onCheckedChange={() =>
                                handleEventSelect(event.id)
                              }
                              disabled={
                                selectedEvents.length >= 2 &&
                                !selectedEvents.includes(event.id)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {formatDate(event.eventDate)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingTopic === event.id ? (
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editedTopicValue}
                                  onChange={(e) =>
                                    setEditedTopicValue(e.target.value)
                                  }
                                  className="h-8 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleTopicSave(event.id);
                                    } else if (e.key === 'Escape') {
                                      handleTopicCancel();
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  onClick={() => handleTopicSave(event.id)}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  onClick={handleTopicCancel}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className={`cursor-pointer hover:bg-muted/50 p-1 rounded ${
                                  canEditTopic(event) ? 'hover:bg-blue-50' : ''
                                }`}
                                onClick={(e) => {
                                  console.log(
                                    'Topic cell clicked for event:',
                                    event.id,
                                  );
                                  e.stopPropagation(); // Prevent event bubbling
                                  if (canEditTopic(event)) {
                                    console.log(
                                      'Permission granted, editing topic',
                                    );
                                    handleTopicEdit(event.id, event.title);
                                  } else {
                                    console.log('No permission to edit topic');
                                  }
                                }}
                              >
                                <span className="font-medium">
                                  {event.title || 'No topic set'}
                                </span>
                                {canEditTopic(event) && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    (click to edit)
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {(() => {
                                  if (
                                    event.eventParticipants &&
                                    event.eventParticipants.length > 0
                                  ) {
                                    const presenters = event.eventParticipants
                                      .map((ep: any) => {
                                        if (ep.staff?.email)
                                          return ep.staff.email;
                                        if (ep.staff?.user?.email)
                                          return ep.staff.user.email;
                                        if (ep.staff?.id)
                                          return `Staff ${ep.staff.id}`;
                                        if (ep.staffId)
                                          return `Staff ${ep.staffId}`;
                                        return 'Unknown Staff';
                                      })
                                      .filter(Boolean);

                                    if (presenters.length > 0) {
                                      return presenters.join(', ');
                                    }
                                  }

                                  // Fallback to participants if available (legacy support)
                                  if (
                                    event.participants &&
                                    event.participants.length > 0
                                  ) {
                                    const presenters = event.participants
                                      .map((p: any) => {
                                        if (p.email) return p.email;
                                        if (p.user?.email) return p.user.email;
                                        if (p.id) return `Staff ${p.id}`;
                                        return 'Unknown Staff';
                                      })
                                      .filter(Boolean);

                                    if (presenters.length > 0) {
                                      return presenters.join(', ');
                                    }
                                  }

                                  // Fallback to participantIds (legacy support)
                                  if (
                                    event.participantIds &&
                                    event.participantIds.length > 0
                                  ) {
                                    return `Staff ${event.participantIds[0]}`;
                                  }

                                  return 'Unassigned';
                                })()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge {...getStatusBadgeProps(event.status)} />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEventForSlide(event);
                                setSlideDialogOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {canEditSlide(event) ? 'Update' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}

        {eventsByCycle.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No cycles found. Create a new cycle to get started.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedEventForSlide &&
        selectedEventForSlide.id &&
        canEditSlide(selectedEventForSlide) && (
          <UpdateSlideDialog
            open={slideDialogOpen}
            onOpenChange={setSlideDialogOpen}
            eventId={selectedEventForSlide.id}
            eventTitle={selectedEventForSlide.title || 'Untitled Event'}
            onSuccess={() => window.location.reload()}
          />
        )}

      {selectedEventForSlide &&
        selectedEventForSlide.id &&
        !canEditSlide(selectedEventForSlide) && (
          <ViewSlideDialog
            open={slideDialogOpen}
            onOpenChange={setSlideDialogOpen}
            eventId={selectedEventForSlide.id}
            eventTitle={selectedEventForSlide.title || 'Untitled Event'}
          />
        )}
    </div>
  );
}
