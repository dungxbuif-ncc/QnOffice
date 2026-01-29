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
import { useEffect, useMemo, useState } from 'react';

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

  onTopicEdit: (eventId: number, currentTopic: string) => void;
  onDateEdit: (eventId: number, date: string) => void;

  onEditSave: (eventId: number) => void;
  onEditCancel: () => void;
  onEditChange: (value: string) => void;

  onSlideClick: (event: ScheduleEvent<IOpentalkSlide>) => void;
  onSelectEvent: (eventId: number) => void;
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
  onTopicEdit,
  onDateEdit,
  onEditSave,
  onEditCancel,
  onEditChange,
  onSlideClick,
  onSelectEvent,
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

  useEffect(() => {
    if (!isOpen) return;

    // Find first future or today event
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetEvent = sortedEvents.find(
      (e) => new Date(e.eventDate) >= today,
    );

    if (targetEvent) {
      setTimeout(() => {
        const element = document.getElementById(
          `opentalk-event-${targetEvent.id}`,
        );
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [sortedEvents, isOpen]);

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
                  {isPast ? 'Đã qua' : 'Đang mở'}
                </Badge>
              </CardTitle>
            </div>

            <div className="text-sm text-muted-foreground">
              {cycle.events?.length || 0} sự kiện
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            {!cycle.events?.length ? (
              <div className="py-8 text-center text-muted-foreground">
                Chưa có sự kiện nào trong chu kỳ này
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {canManageOpentalk && <TableHead className="w-[50px]" />}
                    <TableHead className="w-[140px]">Ngày</TableHead>
                    <TableHead className="w-[250px]">Chủ đề</TableHead>
                    <TableHead className="w-[200px]">Người trình bày</TableHead>
                    <TableHead className="w-[100px]">Trạng thái</TableHead>
                    <TableHead className="w-[120px]">Thao tác</TableHead>
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
                        isSelected={selectedEvents.includes(event.id)}
                        isLocked={lockedEvents.includes(event.id)}
                        onTopicEdit={(id, topic) => onTopicEdit(id, topic)}
                        onDateEdit={(id, date) => onDateEdit(id, date)}
                        onEditChange={onEditChange}
                        onEditSave={() => onEditSave(event.id)}
                        onEditCancel={onEditCancel}
                        onSlideClick={() => onSlideClick(event)}
                        onSelect={() => onSelectEvent(event.id)}
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
