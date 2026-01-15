'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { hasPermission, PERMISSIONS } from '@/shared/auth/permissions';
import { useAuth } from '@/shared/contexts/auth-context';
import {
  opentalkClientService,
  OpentalkEvent,
} from '@/shared/services/client/opentalk-client-service';
import { swapRequestClientService } from '@/shared/services/client/swap-request-client-service';
import {
  ScheduleType,
  SwapRequest,
  SwapRequestStatus,
  UserAuth,
} from '@qnoffice/shared';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CreateSwapRequestModal } from './create-swap-request-modal';
import { SwapRequestTable } from './swap-request-table';

interface SwapRequestManagementProps {
  mode: 'user' | 'hr';
  user?: UserAuth | null;
}

export function SwapRequestManagement({
  mode,
  user: propUser,
}: SwapRequestManagementProps) {
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );
  const [userSchedules, setUserSchedules] = useState<OpentalkEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  const userStaffId = user?.staffId;

  const lockedEventIds = useMemo(() => {
    return swapRequests
      .filter((req) => req.status === SwapRequestStatus.PENDING)
      .flatMap((req) => [req.fromEventId, req.toEventId]);
  }, [swapRequests]);

  const loadSwapRequests = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await swapRequestClientService.getSwapRequests({
        type: ScheduleType.OPENTALK,
      });
      setSwapRequests(response?.data?.data || []);

      if (mode === 'user' && userStaffId) {
        try {
          const schedules =
            await opentalkClientService.getUserSchedules(userStaffId);
          console.log('Loaded schedules:', schedules);
          setUserSchedules(schedules);
        } catch (error) {
          console.error('Failed to load user schedules:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load swap requests:', error);
      toast.error('Failed to load swap requests');
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
        Please log in to access this feature.
      </div>
    );
  }

  const canCreateRequests = hasPermission(
    user?.role,
    PERMISSIONS.CREATE_OPENTALK_SWAP_REQUEST,
  );
  const canManageRequests = hasPermission(
    user?.role,
    PERMISSIONS.MANAGE_OPENTALK_SWAP_REQUESTS,
  );
  const canApproveRequests = hasPermission(
    user?.role,
    PERMISSIONS.APPROVE_OPENTALK_SWAP_REQUESTS,
  );

  const isUserMode = mode === 'user';
  const isHRMode = mode === 'hr';

  if (!isUserMode && !canCreateRequests && !canManageRequests && !isHRMode) {
    return (
      <div className="text-center text-muted-foreground py-8">
        You don&apos;t have permission to access swap requests.
      </div>
    );
  }

  if (!isHRMode && !canApproveRequests) {
    return (
      <div className="text-center text-muted-foreground py-8">
        You don&apos;t have permission to approve swap requests.
      </div>
    );
  }

  const handleReviewRequest = async (
    requestId: number,
    action: SwapRequestStatus,
  ) => {
    if (!canApproveRequests) {
      toast.error("You don't have permission to approve requests");
      return;
    }

    setIsProcessing(requestId);
    try {
      await swapRequestClientService.reviewSwapRequest(requestId, {
        status: action,
        reviewNote:
          action === SwapRequestStatus.APPROVED ? 'Approved' : 'Rejected',
      });

      toast.success(`Request ${action.toLowerCase()} successfully`);
      await loadSwapRequests();
    } catch (error) {
      console.error('Failed to review request:', error);
      toast.error('Failed to review request');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCreateSuccess = async () => {
    setCreateModalOpen(false);
    setSelectedScheduleId(null);
    await loadSwapRequests();
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
            <p className="text-muted-foreground mt-2">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {mode === 'hr' ? 'HR Approval Queue' : 'All Swap Requests'}
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
                    <SelectValue placeholder="Select your schedule to swap" />
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
                          {schedule.title || 'OpenTalk'} -{' '}
                          {new Date(schedule.eventDate).toLocaleDateString()}
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
                  Request Swap
                </Button>
              </div>
            ) : (
              // ...
              <div className="text-sm text-muted-foreground">
                <p>You have no scheduled OpenTalk sessions to swap.</p>
                <p className="text-xs mt-1">
                  User ID: {user?.mezonId} | Schedules: {userSchedules.length}
                </p>
              </div>
            )}

            {selectedScheduleId && (
              <CreateSwapRequestModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                scheduleId={selectedScheduleId}
                onSuccess={handleCreateSuccess}
                lockedEventIds={lockedEventIds}
              />
            )}
          </>
        )}
      </div>

      <SwapRequestTable
        requests={filteredRequests}
        onReview={mode === 'hr' ? handleReviewRequest : undefined}
        isProcessingId={isProcessing}
      />
    </div>
  );
}
