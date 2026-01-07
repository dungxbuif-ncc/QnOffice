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
import { useAuth } from '@/shared/contexts/auth-context';
import { hasPermission, PERMISSIONS } from '@/shared/lib/auth/permissions';
import { opentalkClientService } from '@/shared/lib/client/opentalk-client-service';
import {
  ArrowRightLeft,
  Calendar,
  CheckCircle,
  Plus,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CreateSwapRequestModal } from './create-swap-request-modal';

interface SwapRequest {
  id: number;
  fromEventId: number;
  toEventId: number;
  requesterId: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
  fromEvent?: any;
  toEvent?: any;
  requester?: any;
}

interface SwapRequestManagementProps {
  mode: 'user' | 'hr';
  user?: any;
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
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(
    null,
  );
  const [reviewNote, setReviewNote] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );
  const [userSchedules, setUserSchedules] = useState<any[]>([]);

  // Get staff data from auth context
  const userStaff = user?.staff;
  const [hasStaffAccess, setHasStaffAccess] = useState<boolean>(false);

  const loadSwapRequests = async () => {
    if (!userStaff) return;

    try {
      setIsLoading(true);

      console.log('Loading all swap requests for staff:', userStaff);

      // Load all swap requests for everyone (no filtering by requester)
      const requests = await opentalkClientService.getSwapRequests({});
      setSwapRequests(requests);

      // Load user's current schedules if in user mode
      if (mode === 'user') {
        console.log('Loading schedules for staff ID:', userStaff.id);
        const schedules = await opentalkClientService.getUserSchedules(user.id);
        console.log('User schedules loaded:', schedules);
        setUserSchedules(schedules || []);
      }
    } catch (error) {
      console.error('Failed to load swap requests:', error);
      toast.error('Failed to load swap requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set staff access based on auth context
    setHasStaffAccess(!!userStaff);
    if (userStaff) {
      loadSwapRequests();
    }
  }, [mode, userStaff]);

  // Early return if no user
  if (!user) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Please log in to access this feature.
      </div>
    );
  }

  const canCreateRequests = hasPermission(
    user?.staff?.role,
    PERMISSIONS.CREATE_OPENTALK_SWAP_REQUEST,
  );
  const canManageRequests = hasPermission(
    user?.staff?.role,
    PERMISSIONS.MANAGE_OPENTALK_SWAP_REQUESTS,
  );
  const canApproveRequests = hasPermission(
    user?.staff?.role,
    PERMISSIONS.APPROVE_OPENTALK_SWAP_REQUESTS,
  );

  const isUserMode = mode === 'user';
  const isHRMode = mode === 'hr';

  if (!hasStaffAccess) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>You don't have staff access to this system.</p>
        <p className="text-xs mt-1">
          Please contact HR to set up your staff account.
        </p>
      </div>
    );
  }

  if (isUserMode && !canCreateRequests && !canManageRequests) {
    return (
      <div className="text-center text-muted-foreground py-8">
        You don't have permission to access swap requests.
      </div>
    );
  }

  if (isHRMode && !canApproveRequests) {
    return (
      <div className="text-center text-muted-foreground py-8">
        You don't have permission to approve swap requests.
      </div>
    );
  }

  const handleReviewRequest = async (
    requestId: number,
    action: 'APPROVED' | 'REJECTED',
  ) => {
    if (!canApproveRequests) {
      toast.error("You don't have permission to approve requests");
      return;
    }

    try {
      await opentalkClientService.reviewSwapRequest(requestId, {
        status: action,
        reviewNote: reviewNote,
      });

      toast.success(`Request ${action.toLowerCase()} successfully`);
      setReviewModalOpen(false);
      setSelectedRequest(null);
      setReviewNote('');

      // Reload swap requests
      await loadSwapRequests();
    } catch (error) {
      console.error('Failed to review request:', error);
      toast.error('Failed to review request');
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
      : swapRequests.filter((req) => req.requesterId === userStaff?.id);

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
                    {userSchedules.map((schedule) => (
                      <SelectItem
                        key={schedule.id}
                        value={schedule.id.toString()}
                      >
                        {schedule.topic || 'OpenTalk'} -{' '}
                        {new Date(schedule.date).toLocaleDateString()}
                      </SelectItem>
                    ))}
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
              <div className="text-sm text-muted-foreground">
                <p>You have no scheduled OpenTalk sessions to swap.</p>
                <p className="text-xs mt-1">
                  User ID: {user?.id} | Schedules: {userSchedules.length}
                </p>
              </div>
            )}

            {selectedScheduleId && (
              <CreateSwapRequestModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                scheduleId={selectedScheduleId}
                onSuccess={handleCreateSuccess}
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
                    ? 'No swap requests pending approval'
                    : 'You have not submitted any swap requests'}
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
                        {request.createdAt.toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-900">
                            From Event
                          </span>
                        </div>
                        <p className="text-sm text-red-800">
                          Event ID: {request.fromEventId}
                        </p>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-900">
                            To Event
                          </span>
                        </div>
                        <p className="text-sm text-green-800">
                          Event ID: {request.toEventId}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">Reason:</p>
                      <p className="text-sm text-muted-foreground">
                        {request.reason}
                      </p>
                    </div>

                    {request.reviewNote && (
                      <div>
                        <p className="text-sm font-medium mb-1">Review Note:</p>
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
                          Review
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
            <DialogTitle>Review Swap Request</DialogTitle>
            <DialogDescription>
              Review and approve or reject this swap request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Request Details:</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.reason}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Review Note (optional)
                </label>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add a note about your decision..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                selectedRequest &&
                handleReviewRequest(selectedRequest.id, 'REJECTED')
              }
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() =>
                selectedRequest &&
                handleReviewRequest(selectedRequest.id, 'APPROVED')
              }
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
