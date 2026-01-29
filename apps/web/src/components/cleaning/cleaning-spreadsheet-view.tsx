'use client';

import { ActionPanel } from '@/components/ui/action-panel';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useAuth } from '@/shared/contexts/auth-context';
import { cleaningClientService } from '@/shared/services/client/cleaning-client-service';
import { formatDateVN } from '@/shared/utils';
import { ArrowRightLeft, Download, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CleaningCycleCard } from './cleaning-cycle-card';

interface CleaningSpreadsheetViewProps {
  events: any[];
  cycles: any[];
}

export function CleaningSpreadsheetView({
  events,
  cycles,
}: CleaningSpreadsheetViewProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<
    Array<{ eventId: number; staffId: number; email: string; cycleId: number }>
  >([]);
  const [isSwapping, setIsSwapping] = useState(false);

  // Removed local formatDate in favor of shared/utils/formatDateVN

  const getParticipantNames = (eventParticipants: any[]) => {
    if (!eventParticipants?.length) return 'Không có người trực';

    return eventParticipants
      .map(
        (participant) =>
          participant.staff?.user?.email ||
          participant.staff?.email ||
          'Không xác định',
      )
      .join(' & ');
  };

  const handleExportData = () => {
    // Create CSV content
    const headers = ['Ngày', 'Thứ', 'Người tham gia', 'Trạng thái', 'Ghi chú'];
    const csvContent = [
      headers.join(','),
      ...events
        .map((event) => [
          event.eventDate,
          formatDateVN(event.eventDate),
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

    toast.success('Lịch trực xuất thành công');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Dữ liệu đã được làm mới');
    }, 1000);
  };

  const handleParticipantToggle = (
    eventId: number,
    staffId: number,
    email: string,
    cycleId: number,
  ) => {
    // Validate event
    const targetEvent = events.find((e) => e.id === eventId);
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

    setSelectedParticipants((prev) => {
      const exists = prev.find(
        (p) => p.eventId === eventId && p.staffId === staffId,
      );
      if (exists) {
        return prev.filter(
          (p) => !(p.eventId === eventId && p.staffId === staffId),
        );
      }

      // Prevent selecting from same event
      if (prev.length > 0 && prev[0].eventId === eventId) {
        toast.error('Không thể chọn người trực trong cùng một sự kiện');
        return prev;
      }

      // Prevent selecting from different cycles
      if (prev.length > 0 && prev[0].cycleId !== cycleId) {
        toast.error('Không thể chọn người trực ở các chu kỳ khác nhau');
        return prev;
      }

      if (prev.length >= 2) {
        toast.error('Bạn chỉ có thể chọn 2 người để đổi lịch');
        return prev;
      }
      return [...prev, { eventId, staffId, email, cycleId }];
    });
  };

  const handleSwapParticipants = async () => {
    if (selectedParticipants.length !== 2) {
      toast.error('Vui lòng chọn đúng 2 người để đổi lịch');
      return;
    }

    setIsSwapping(true);
    try {
      const [p1, p2] = selectedParticipants;
      await cleaningClientService.swapParticipants({
        participant1: { eventId: p1.eventId, staffId: p1.staffId },
        participant2: { eventId: p2.eventId, staffId: p2.staffId },
      });

      toast.success('Đổi lịch trực thành công');
      setSelectedParticipants([]);
      window.location.reload();
    } catch (error) {
      toast.error('Lỗi khi đổi lịch trực');
      console.error(error);
    } finally {
      setIsSwapping(false);
    }
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
    return cycle?.name || `Chu kỳ ${cycleId}`;
  };

  return (
    <div className="space-y-6">
      {/* Swap Controls - Fixed Bottom */}
      <ActionPanel
        open={selectedParticipants.length > 0}
        onClose={() => setSelectedParticipants([])}
        icon={<ArrowRightLeft className="h-5 w-5" />}
        title={
          selectedParticipants.length === 1
            ? `1 người đã chọn (${
                selectedParticipants[0]?.email || 'N/A'
              }). Chọn thêm 1 người nữa để đổi.`
            : `2 người đã chọn (${
                selectedParticipants[0]?.email || 'N/A'
              } ↔ ${
                selectedParticipants[1]?.email || 'N/A'
              }). Sẵn sàng đổi lịch.`
        }
        variant="warning"
        primaryAction={{
          label: 'Đổi người trực',
          onClick: handleSwapParticipants,
          disabled: selectedParticipants.length !== 2,
          loading: isSwapping,
        }}
        secondaryAction={{
          label: 'Hủy chọn',
          onClick: () => setSelectedParticipants([]),
          variant: 'outline',
        }}
        showClose={false}
      />

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold">Lịch Trực Nhật</h2>
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
            Làm mới
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Xuất file
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-240px)] flex flex-col">
        {Object.entries(eventsByCycle).length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Không tìm thấy chu kỳ trực nhật nào</CardTitle>
              <CardDescription>
                Chưa có lịch trực nhật nào được lên.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="flex-1 overflow-y-auto pr-4 space-y-6">
            {Object.entries(eventsByCycle).map(([cycleKey, cycleEvents]) => {
              const cycleId = parseInt(cycleKey.replace('cycle-', ''));
              return (
                <CleaningCycleCard
                  key={cycleKey}
                  cycleId={cycleId}
                  cycleName={getCycleName(cycleId)}
                  cycleEvents={cycleEvents}
                  selectedParticipants={selectedParticipants}
                  onParticipantToggle={handleParticipantToggle}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
