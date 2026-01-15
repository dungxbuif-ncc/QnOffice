'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { swapRequestClientService } from '@/shared/services/client/swap-request-client-service';
import {
  ICreateSwapRequestDto,
  ScheduleEvent,
  ScheduleType,
} from '@qnoffice/shared';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CreateSwapRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: number;
  onSuccess?: () => void;
  userStaffId?: number;
}

export function CreateSwapRequestModal({
  open,
  onOpenChange,
  scheduleId,
  onSuccess,
  userStaffId,
}: CreateSwapRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<ScheduleEvent[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<{
    eventId: number;
    staffId: number;
  } | null>(null);
  const [reason, setReason] = useState('');

  const fetchAvailableEvents = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/cleaning/events/${scheduleId}/cycle-events?participantId=${userStaffId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableEvents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching available events for swap:', error);
      toast.error('Không thể tải sự kiện khả dụng');
    }
  }, [scheduleId]);

  useEffect(() => {
    if (open) {
      fetchAvailableEvents();
      setReason('');
      setSelectedParticipant(null);
    }
  }, [open, fetchAvailableEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParticipant) {
      toast.error('Vui lòng chọn người tham gia để đổi lịch');
      return;
    }

    setIsLoading(true);

    try {
      const requestData: ICreateSwapRequestDto = {
        fromEventId: scheduleId,
        toEventId: selectedParticipant.eventId,
        reason: reason,
        type: ScheduleType.CLEANING,
        targetStaffId: selectedParticipant.staffId,
      };

      await swapRequestClientService.createSwapRequest(requestData);

      toast.success('Tạo yêu cầu đổi lịch thành công');
      setReason('');
      setSelectedParticipant(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating swap request:', error);
      toast.error('Tạo yêu cầu đổi lịch thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yêu cầu đổi lịch dọn dẹp</DialogTitle>
          <DialogDescription>
            Chọn người tham gia từ sự kiện dọn dẹp khác để đổi lịch. Bạn sẽ nhận
            ngày của họ và họ sẽ nhận ngày của bạn.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetEvent">
                Chọn người tham gia để đổi lịch
              </Label>
              <Select
                value={
                  selectedParticipant
                    ? `${selectedParticipant.eventId}-${selectedParticipant.staffId}`
                    : ''
                }
                onValueChange={(value) => {
                  const [eventId, staffId] = value.split('-').map(Number);
                  setSelectedParticipant({ eventId, staffId });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sự kiện của người tham gia" />
                </SelectTrigger>
                <SelectContent>
                  {availableEvents.flatMap((event) => {
                    const participants = event.eventParticipants || [];

                    if (participants.length === 0) {
                      return (
                        <SelectItem
                          key={event.id}
                          value={event.id.toString()}
                          disabled
                        >
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">
                              Không có người tham gia
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.eventDate).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    }

                    return participants.map((participant) => (
                      <SelectItem
                        key={`${event.id}-${participant.staffId}`}
                        value={`${event.id}-${participant.staffId}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {participant.staff?.user?.name ||
                              participant.staff?.email ||
                              'Không rõ'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.eventDate).toLocaleDateString()}
                          </span>
                        </div>
                      </SelectItem>
                    ));
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Giải thích lý do bạn cần đổi lịch với người này..."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Lưu ý: Bạn sẽ được chuyển sang ngày dọn dẹp của họ, và họ sẽ
                được chuyển sang ngày của bạn.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading || !selectedParticipant}>
              {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
