'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { hasPermission, PERMISSIONS } from '@/shared/auth/permissions';
import { useAuth } from '@/shared/contexts/auth-context';
import {
  cleaningClientService,
  CleaningEvent,
} from '@/shared/services/client/cleaning-client-service';
import { swapRequestClientService } from '@/shared/services/client/swap-request-client-service';
import {
  ScheduleType,
  SwapRequest,
  SwapRequestStatus,
  UserAuth,
} from '@qnoffice/shared';
import {
  ArrowRightLeft,
  Calendar,
  CheckCircle,
  Plus,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CreateSwapRequestModal } from './create-swap-request-modal';

interface SwapRequestManagementProps {
  mode: 'user' | 'hr';
  user?: UserAuth | null;
}

export function SwapRequestManagement({
  mode,
  user: propUser,
}: SwapRequestManagementProps) {
  console.log(mode);

  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(
    null,
  );
  const [reviewNote, setReviewNote] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );
  const [userSchedules, setUserSchedules] = useState<CleaningEvent[]>([]);

  const userStaffId = user?.staffId;

  const loadSwapRequests = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load all swap requests for everyone (no filtering by requester)
      const response = await swapRequestClientService.getSwapRequests({
        type: ScheduleType.CLEANING,
      });
      setSwapRequests(response?.data?.data || []);

      // Load user's schedules in user mode
      if (mode === 'user' && userStaffId) {
        try {
          const schedulesResponse =
            await cleaningClientService.getUserSchedules(userStaffId);
          console.log('Schedules response:', schedulesResponse);
          const schedules =
            schedulesResponse?.data?.data || schedulesResponse?.data || [];
          console.log('Extracted schedules:', schedules);
          setUserSchedules(schedules);
        } catch (error) {
          console.error('Failed to load user schedules:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load swap requests:', error);
      toast.error('Không thể tải yêu cầu đổi lịch');
    } finally {
      setIsLoading(false);
    }
  }, [mode, userStaffId]);

  useEffect(() => {
    if (user?.staffId) {
      loadSwapRequests();
    }
  }, [user?.staffId, loadSwapRequests]);
  // Early return if no user
  if (!user) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Vui lòng đăng nhập để sử dụng chức năng này.
      </div>
    );
  }

  const canCreateRequests = hasPermission(
    user?.role,
    PERMISSIONS.CREATE_CLEANING_SWAP_REQUEST,
  );
  const canManageRequests = hasPermission(
    user?.role,
    PERMISSIONS.MANAGE_CLEANING_SWAP_REQUESTS,
  );
  const canApproveRequests = hasPermission(
    user?.role,
    PERMISSIONS.APPROVE_CLEANING_SWAP_REQUESTS,
  );

  const isUserMode = mode === 'user';
  const isHRMode = mode === 'hr';

  if (isUserMode && !canCreateRequests && !canManageRequests && !isHRMode) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Bạn không có quyền truy cập yêu cầu đổi lịch.
      </div>
    );
  }

  if (!isHRMode && !canApproveRequests) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Bạn không có quyền duyệt yêu cầu đổi lịch.
      </div>
    );
  }

  const handleReviewRequest = async (
    requestId: number,
    action: SwapRequestStatus,
  ) => {
    if (!canApproveRequests) {
      toast.error('Bạn không có quyền duyệt yêu cầu');
      return;
    }

    try {
      await swapRequestClientService.reviewSwapRequest(requestId, {
        status: action,
        reviewNote: reviewNote,
      });

      toast.success(
        `Yêu cầu đã được ${action === 'APPROVED' ? 'duyệt' : 'từ chối'} thành công`,
      );
      setReviewModalOpen(false);
      setSelectedRequest(null);
      setReviewNote('');

      // Reload swap requests
      await loadSwapRequests();
    } catch (error) {
      console.error('Failed to review request:', error);
      toast.error('Duyệt yêu cầu thất bại');
    }
  };

  const handleCreateSuccess = async () => {
    setCreateModalOpen(false);
    setSelectedScheduleId(null);
    await loadSwapRequests();
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

  const filteredRequests =
    mode === 'hr'
      ? swapRequests
      : swapRequests.filter((req) => req.requesterId === user?.staffId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Đang tải yêu cầu...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {mode === 'hr'
            ? 'Danh sách duyệt yêu cầu đổi lịch'
            : 'Yêu cầu đổi lịch của tôi'}
        </h2>
        {mode === 'user' && canCreateRequests && (
          <>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading your schedules...
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
                    {userSchedules.map((schedule) => (
                      <SelectItem
                        key={schedule.id}
                        value={schedule.id.toString()}
                      >
                        {schedule.title || 'Cleaning'} -{' '}
                        {new Date(schedule.eventDate).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  disabled={!selectedScheduleId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo yêu cầu đổi lịch
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>Bạn chưa có lịch trực nhật nào để đổi.</p>
                <p className="text-xs mt-1">
                  Mã người dùng: {user?.mezonId} | Số lịch:{' '}
                  {userSchedules.length}
                </p>
              </div>
            )}

            {selectedScheduleId && (
              <CreateSwapRequestModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                scheduleId={selectedScheduleId}
                onSuccess={handleCreateSuccess}
                userStaffId={userStaffId}
              />
            )}
          </>
        )}
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {mode === 'hr'
                    ? 'Không có yêu cầu đổi lịch nào cần duyệt'
                    : 'Bạn chưa gửi yêu cầu đổi lịch nào'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">
                            Lịch hiện tại của bạn
                          </span>
                        </div>
                        <p className="text-sm text-blue-800">
                          Date: {request?.fromEvent?.eventDate}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          Participants:{' '}
                          {request?.fromEvent?.eventParticipants
                            ?.map((p) => p.staff?.user?.name || p.staff?.email)
                            .join(', ') || 'N/A'}
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
                          Date: {request?.toEvent?.eventDate}
                        </p>
                        <p className="text-sm text-purple-700 mt-1">
                          Participants:{' '}
                          {request?.toEvent?.eventParticipants
                            ?.map((p) => p.staff?.user?.name || p.staff?.email)
                            .join(', ') || 'N/A'}
                        </p>
                      </div>
                    </div>

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

                  {mode === 'hr' &&
                    request.status === 'PENDING' &&
                    canApproveRequests && (
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setReviewModalOpen(true);
                          }}
                        >
                          Duyệt
                        </Button>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt yêu cầu đổi lịch</DialogTitle>
            <DialogDescription>
              Duyệt và chấp nhận hoặc từ chối yêu cầu đổi lịch này.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Chi tiết yêu cầu:</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.reason}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Ghi chú duyệt (không bắt buộc)
                </label>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Thêm ghi chú về quyết định của bạn..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedRequest &&
                handleReviewRequest(
                  selectedRequest.id,
                  SwapRequestStatus.REJECTED,
                )
              }
            >
              <XCircle className="h-4 w-4 mr-2" />
              Từ chối
            </Button>
            <Button
              onClick={() =>
                selectedRequest &&
                handleReviewRequest(
                  selectedRequest.id,
                  SwapRequestStatus.APPROVED,
                )
              }
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Chấp nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
