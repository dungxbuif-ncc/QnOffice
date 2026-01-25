'use client';

import { CycleCard } from '@/components/opentalk/cycle-card';
import { SlideDialog } from '@/components/opentalk/slide-dialog';
import { hasPermission, PERMISSIONS } from '@/shared/auth/permissions';
import { useAuth } from '@/shared/contexts/auth-context';
import { useSwapRequests } from '@/shared/hooks/use-swap-requests';
import { opentalkClientService } from '@/shared/services/client/opentalk-client-service';
import {
  IOpentalkSlide,
  ScheduleCycle,
  ScheduleEvent,
  ScheduleType,
  SwapRequestStatus,
} from '@qnoffice/shared';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SwapControls } from './swap-controls';

type EditingField = {
  eventId: number;
  field: 'topic' | 'date';
} | null;

interface OpentalkSpreadsheetViewProps {
  cycles: ScheduleCycle<IOpentalkSlide>[];
}

export function OpentalkSpreadsheetView({
  cycles = [],
}: OpentalkSpreadsheetViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const userStaffId = user?.staffId;

  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editedValue, setEditedValue] = useState('');
  const [slideDialogOpen, setSlideDialogOpen] = useState(false);
  const [selectedEventForSlide, setSelectedEventForSlide] =
    useState<ScheduleEvent<IOpentalkSlide> | null>(null);

  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [slideReadonly, setSlideReadonly] = useState(false);

  const { data: swapRequests } = useSwapRequests({
    type: ScheduleType.OPENTALK,
    status: SwapRequestStatus.PENDING,
  });

  const lockedEvents = useMemo(() => {
    return (
      swapRequests?.flatMap((req) => [req.fromEventId, req.toEventId]) || []
    );
  }, [swapRequests]);

  const canManageOpentalk = hasPermission(
    user?.role,
    PERMISSIONS.MANAGE_OPENTALK,
  );

  const canEditTopic = (event: ScheduleEvent<IOpentalkSlide>) => {
    if (event.status === 'COMPLETED') return false;

    if (hasPermission(user?.role, PERMISSIONS.EDIT_OPENTALK_TOPIC)) {
      return true;
    }

    return (
      event.eventParticipants?.some((p) => p.staffId === userStaffId) || false
    );
  };

  const handleTopicEdit = (eventId: number, currentTopic: string) => {
    setEditingField({ eventId, field: 'topic' });
    setEditedValue(currentTopic || '');
  };

  const handleTopicSave = async (eventId: number) => {
    try {
      await opentalkClientService.updateEvent(eventId, {
        title: editedValue,
      });
      toast.success('Đã cập nhật chủ đề');
      setEditingField(null);
      router.refresh();
    } catch {
      toast.error('Cập nhật chủ đề thất bại');
    }
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditedValue('');
  };

  const handleSelectEvent = (eventId: number) => {
    if (lockedEvents.includes(eventId)) {
      toast.error('Sự kiện này đang có yêu cầu đổi lịch chờ duyệt');
      return;
    }

    // Find the event first to validate
    let targetEvent: ScheduleEvent<IOpentalkSlide> | undefined;
    for (const cycle of cycles) {
      const found = cycle.events?.find((e) => e.id === eventId);
      if (found) {
        targetEvent = found;
        break;
      }
    }

    if (targetEvent) {
      const isPast = new Date(targetEvent.eventDate).getTime() < Date.now();
      if (
        isPast ||
        targetEvent.status === 'COMPLETED' ||
        targetEvent.status === 'CANCELLED'
      ) {
        toast.error('Không thể chọn sự kiện đã kết thúc hoặc trong quá khứ');
        return;
      }
    }

    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(selectedEvents.filter((id) => id !== eventId));
    } else {
      if (selectedEvents.length >= 2) {
        toast.error('Chỉ được chọn tối đa 2 sự kiện để đổi lịch');
        return;
      }

      // Check if same cycle
      if (selectedEvents.length === 1 && targetEvent) {
        const firstEventId = selectedEvents[0];
        // Find first event to check cycleId
        let firstEvent: ScheduleEvent | undefined;
        for (const cycle of cycles) {
          const e1 = cycle.events?.find((e) => e.id === firstEventId);
          if (e1) {
            firstEvent = e1;
            break;
          }
        }

        if (
          firstEvent &&
          targetEvent &&
          firstEvent.cycleId !== targetEvent.cycleId
        ) {
          toast.error(
            'Chỉ được đổi lịch giữa các sự kiện trong cùng một chu kỳ',
          );
          return;
        }
      }

      setSelectedEvents([...selectedEvents, eventId]);
    }
  };

  const handleClearSelection = () => {
    setSelectedEvents([]);
  };

  const handleSwapEvents = async () => {
    if (selectedEvents.length !== 2) return;

    setIsSwapping(true);
    try {
      await opentalkClientService.swapEvents({
        event1Id: selectedEvents[0],
        event2Id: selectedEvents[1],
      });
      toast.success('Đổi lịch thành công');
      router.refresh();
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Đổi lịch thất bại');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSlideClick = (event: ScheduleEvent<IOpentalkSlide>) => {
    setSelectedEventForSlide(event);
    setSlideReadonly(isEventCheckboxDisabled(event));
    setSlideDialogOpen(true);
  };

  const sortedCycles = useMemo(() => {
    return [...cycles].sort((a, b) => {
      // Helper to get latest event timestamp
      const getLatestEventTime = (cycle: typeof a) => {
        if (!cycle.events?.length) return new Date(cycle.createdAt).getTime();
        return cycle.events.reduce((max, e) => {
          const time = new Date(e.eventDate).getTime();
          return time > max ? time : max;
        }, 0);
      };

      const timeA = getLatestEventTime(a);
      const timeB = getLatestEventTime(b);

      // Sort ASC: Earlier cycles first
      return timeA - timeB;
    });
  }, [cycles]);

  const handleDateEdit = (eventId: number, date: string) => {
    setEditingField({ eventId, field: 'date' });
    setEditedValue(date.split('T')[0]);
  };

  const handleDateSave = async (eventId: number) => {
    try {
      await opentalkClientService.updateEvent(eventId, {
        eventDate: editedValue,
      });
      toast.success('Đã cập nhật ngày');
      setEditingField(null);
      router.refresh();
    } catch {
      toast.error('Cập nhật ngày thất bại');
    }
  };

  const isEventCheckboxDisabled = (event: ScheduleEvent<IOpentalkSlide>) => {
    const isPast = new Date(event.eventDate).getTime() < Date.now();
    const isCompleted =
      event.status === 'COMPLETED' || event.status === 'CANCELLED';

    return lockedEvents.includes(event.id) || isPast || isCompleted;
  };

  return (
    <div className="h-[calc(100vh-240px)] flex flex-col">
      <div className="flex-1 overflow-y-auto pr-4 space-y-6">
        {sortedCycles.map((cycle) => (
          <CycleCard
            key={cycle.id}
            cycle={cycle}
            editingField={editingField}
            editedValue={editedValue}
            selectedEvents={selectedEvents}
            canManageOpentalk={canManageOpentalk}
            canEditTopic={canEditTopic}
            onTopicEdit={handleTopicEdit}
            onEditCancel={handleEditCancel}
            onEditChange={setEditedValue}
            onSlideClick={handleSlideClick}
            onSelectEvent={handleSelectEvent}
            lockedEvents={lockedEvents}
            onDateEdit={handleDateEdit}
            onEditSave={
              editingField?.field === 'date' ? handleDateSave : handleTopicSave
            }
          />
        ))}
      </div>

      <SwapControls
        selectedCount={selectedEvents.length}
        isSwapping={isSwapping}
        onSwap={handleSwapEvents}
        onClear={handleClearSelection}
      />

      {selectedEventForSlide && selectedEventForSlide.id && (
        <SlideDialog
          mode={slideReadonly ? 'view' : 'edit'}
          canEdit={!slideReadonly && canEditTopic(selectedEventForSlide)}
          event={selectedEventForSlide}
          open={slideDialogOpen}
          onOpenChange={setSlideDialogOpen}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
