'use client';

import { EventTableRow } from '@/components/opentalk/event-table-row';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IOpentalkSlide, ScheduleCycle, ScheduleEvent } from '@qnoffice/shared';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface EditingField {
  eventId: number;
  field: 'topic' | 'date';
}

interface CycleCardProps {
  cycle: ScheduleCycle;
  editingField: EditingField | null;
  editedValue: string;

  selectedEvents: number[];
  canManageOpentalk: boolean;

  canEditTopic: (event: ScheduleEvent<IOpentalkSlide>) => boolean;
  canEditSlide: (event: ScheduleEvent<IOpentalkSlide>) => boolean;

  onTopicEdit: (eventId: number, currentTopic: string) => void;
  onDateEdit: (eventId: number, date: string) => void;

  onEditSave: (eventId: number) => void;
  onEditCancel: () => void;
  onEditChange: (value: string) => void;

  onSlideClick: (event: ScheduleEvent<IOpentalkSlide>) => void;
  onSelectEvent: (eventId: number) => void;
  formatDate: (date: string) => string;
  lockedEvents?: number[];
}
// hoặc file hiện tại

export function CycleCard({
  cycle,
  editingField,
  editedValue,

  selectedEvents,
  canManageOpentalk,

  canEditTopic,
  canEditSlide,

  onTopicEdit,
  onDateEdit,

  onEditSave,
  onEditCancel,
  onEditChange,

  onSlideClick,
  onSelectEvent,
  formatDate,
  lockedEvents = [],
}: CycleCardProps) {
  const sortedEvents = useMemo(() => {
    return [...(cycle.events || [])].sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
    );
  }, [cycle.events]);

  const isPast = useMemo(() => {
    if (!sortedEvents.length) return false;
    const latestEvent = sortedEvents[sortedEvents.length - 1];
    return new Date(latestEvent.eventDate) < new Date();
  }, [sortedEvents]);

  const [isOpen, setIsOpen] = useState(!isPast);

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
                <span>{cycle.name}</span>
                <Badge variant={isPast ? 'secondary' : 'default'}>
                  {isPast ? 'Past' : 'Active'}
                </Badge>
              </CardTitle>
            </div>

            <div className="text-sm text-muted-foreground">
              {cycle.events?.length || 0} events
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            {!cycle.events?.length ? (
              <div className="py-8 text-center text-muted-foreground">
                No events scheduled for this cycle
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {canManageOpentalk && <TableHead className="w-[50px]" />}
                    <TableHead className="w-[140px]">Date</TableHead>
                    <TableHead className="w-[250px]">Topic</TableHead>
                    <TableHead className="w-[200px]">Presenter</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sortedEvents.map((event) => {
                    const isEditingTopic =
                      editingField?.eventId === event.id &&
                      editingField.field === 'topic';

                    const isEditingDate =
                      editingField?.eventId === event.id &&
                      editingField.field === 'date';

                    return (
                      <EventTableRow
                        key={event.id}
                        event={event}
                        editedValue={editedValue}
                        isEditingTopic={isEditingTopic}
                        isEditingDate={isEditingDate}
                        canManageOpentalk={canManageOpentalk}
                        canEditTopic={canEditTopic(event)}
                        canEditSlide={canEditSlide(event)}
                        isSelected={selectedEvents.includes(event.id)}
                        isLocked={lockedEvents.includes(event.id)}
                        onTopicEdit={(id, topic) => onTopicEdit(id, topic)}
                        onDateEdit={(id, date) => onDateEdit(id, date)}
                        onEditChange={onEditChange}
                        onEditSave={() => onEditSave(event.id)}
                        onEditCancel={onEditCancel}
                        onSlideClick={() => onSlideClick(event)}
                        onSelect={() => onSelectEvent(event.id)}
                        formatDate={formatDate}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
