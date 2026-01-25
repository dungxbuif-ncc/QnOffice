'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/shared/contexts/auth-context';
import { useSwapRequests } from '@/shared/hooks/use-swap-requests';
import { useOpentalkUserSchedules } from '@/shared/hooks/use-user-schedules';
import { formatDateVN } from '@/shared/utils';
import { ScheduleType, SwapRequestStatus } from '@qnoffice/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Calendar, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CreateSwapRequestModal } from './create-swap-request-modal';

export function SwapRequestManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );

  const userStaffId = user?.staffId;

  const {
    data: swapRequests = [],
    isLoading: isRequestsLoading,
  } = useSwapRequests({
    type: ScheduleType.OPENTALK,
  });

  const {
    data: userSchedules = [],
    isLoading: isSchedulesLoading,
  } = useOpentalkUserSchedules(userStaffId);

  const isLoading = isRequestsLoading;

  const lockedEventIds = useMemo(() => {
    return swapRequests
      .filter((req) => req.status === SwapRequestStatus.PENDING)
      .flatMap((req) => [req.fromEventId, req.toEventId]);
  }, [swapRequests]);

  const handleCreateSuccess = async () => {
    setCreateModalOpen(false);
    setSelectedScheduleId(null);
    queryClient.invalidateQueries({ queryKey: ['swap-requests'] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = swapRequests;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Danh sách yêu cầu đổi lịch</h2>
        {
          <>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Đang tải lịch của bạn...
              </p>
            ) : userSchedules.length > 0 ? (
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedScheduleId?.toString() || ''}
                  onValueChange={(value) =>
                    setSelectedScheduleId(parseInt(value))
                  }
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Chọn lịch trực để đổi" />
                  </SelectTrigger>
                  <SelectContent>
                    {userSchedules.map((schedule) => {
                      const isLocked = lockedEventIds.includes(schedule.id);
                      return (
                        <SelectItem
                          key={schedule.id}
                          value={schedule.id.toString()}
                          disabled={isLocked}
                        >
                          {schedule.title || 'Lịch OpenTalk'} -{' '}
                          {formatDateVN(schedule.eventDate)}
                          {isLocked ? ' (Chờ duyệt)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  disabled={!selectedScheduleId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo yêu cầu
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>Bạn không có lịch OpenTalk nào để đổi.</p>
                <p className="text-xs mt-1">Số lịch: {userSchedules.length}</p>
              </div>
            )}

            {selectedScheduleId && (
              <CreateSwapRequestModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                scheduleId={selectedScheduleId}
                onSuccess={handleCreateSuccess}
                lockedEventIds={lockedEventIds}
                userStaffId={userStaffId}
              />
            )}
          </>
        }
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có yêu cầu đổi lịch nào</p>
              </div>
            </CardContent>
          </Card>
          ) : (
          filteredRequests.map((request) => {
            const isApproved = request.status === SwapRequestStatus.APPROVED;

            const getParticipantNames = (event: any) => {
              return (
                event?.eventParticipants
                  ?.map((p: any) => p.staff?.user?.name || p.staff?.email)
                  .join(', ') || 'N/A'
              );
            };

            const requesterName =
              request.requester?.user?.name ||
              request.requester?.email ||
              'Unknown';
            const targetNames = getParticipantNames(request.toEvent);

            return (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                          <span className="text-sm font-medium">
                            Yêu cầu bởi: {requesterName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDateVN(request.createdAt)}
                          </span>
                        </div>
                      </div>

                      {isApproved ? (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Đã đổi thành công
                          </h4>
                          <div className="space-y-4">
                            {/* Slot A - Now has Target */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-green-200 last:border-0 last:pb-0">
                              <div>
                                <span className="font-medium text-green-900 block">
                                  Ngày: {formatDateVN(request.toEvent?.eventDate)}
                                </span>
                                <div className="text-sm text-green-800 mt-1">
                                  <span className="font-medium">
                                    Người tham gia:
                                  </span>{' '}
                                  {targetNames}{' '}
                                  <span className="text-muted-foreground whitespace-nowrap">
                                    (<span className="line-through decoration-slate-500 decoration-1">{requesterName}</span>)
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Slot B - Now has Requester */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="font-medium text-green-900 block">
                                  Ngày: {formatDateVN(request.fromEvent?.eventDate)}
                                </span>
                                <div className="text-sm text-green-800 mt-1">
                                  <span className="font-medium">
                                    Người tham gia:
                                  </span>{' '}
                                  {getParticipantNames(request.fromEvent)}{' '}
                                  <span className="text-muted-foreground whitespace-nowrap">
                                    (<span className="line-through decoration-slate-500 decoration-1">{targetNames}</span>)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-900">
                                Lịch hiện tại
                              </span>
                            </div>
                            <p className="text-sm text-blue-800">
                              Ngày: {formatDateVN(request?.fromEvent?.eventDate)}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              Người tham gia:{' '}
                              {getParticipantNames(request.fromEvent)}
                            </p>
                          </div>

                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span className="font-medium text-purple-900">
                                Lịch muốn đổi
                              </span>
                            </div>
                            <p className="text-sm text-purple-800">
                              Ngày: {formatDateVN(request?.toEvent?.eventDate)}
                            </p>
                            <p className="text-sm text-purple-700 mt-1">
                              Người tham gia:{' '}
                              {getParticipantNames(request.toEvent)}
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium mb-1">Lý do:</p>
                        <p className="text-sm text-muted-foreground">
                          {request.reason}
                        </p>
                      </div>

                      {request.reviewNote && (
                        <div>
                          <p className="text-sm font-medium mb-1">
                            Ghi chú duyệt:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {request.reviewNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
